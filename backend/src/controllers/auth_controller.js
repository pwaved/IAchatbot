import Usuario from '../models/usuario_model.js';
import Perfil from '../models/perfil_model.js';
import models from '../models/index.js';
import crypto from 'crypto';
import Permissao from '../models/permissao_model.js';
import { sendPasswordResetCodeEmail } from '../utils/nodemailer.js';
import { sessionStore, sequelize } from '../config/database.js';


class AuthController {
    async register(req, res) {
        const { nome, email, password, perfil: perfilNome } = req.body;

        if (!nome || !email || !password || !perfilNome) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }

        const t = await models.sequelize.transaction(); // Inicia uma transação

        try {
            // Verifica se o email já está em uso
            const emailExists = await Usuario.findOne({ where: { email } });
            if (emailExists) {
                return res.status(400).json({ error: 'Este email já está em uso.' });
            }

            // Cria o usuário no banco
            const novoUsuario = await Usuario.create({ nome, email, password }, { transaction: t });

            // Busca o perfil pelo nome legível
            const perfil = await Perfil.findOne({ where: { nome_perfil: perfilNome } });
            if (!perfil) {
                await t.rollback(); // Desfaz a transação
                return res.status(400).json({ error: 'Perfil inválido.' });
            }

            // Associa o perfil ao usuário
            await novoUsuario.addPerfil(perfil, { transaction: t });
            await t.commit(); // Confirma a transação

            // Remove a senha antes de responder
            novoUsuario.senha_hash = undefined;

            return res.status(201).json({
                usuario: {
                    id: novoUsuario.id,
                    nome: novoUsuario.nome,
                    email: novoUsuario.email,
                    perfil: perfil.nome_perfil,
                },
            });
        } catch (error) {
            await t.rollback();
            console.error(error);
            return res.status(500).json({ error: 'Falha ao registrar usuário.', details: error.message });
        }
    }


    async login(req, res, next) {
        const t = await sequelize.transaction();

        try {
            const { email, password } = req.body;

            const userToLock = await Usuario.findOne({
                where: { email },
                attributes: ['id'], // paassa o id
                transaction: t,
                lock: t.LOCK.UPDATE
            });



            if (!userToLock) {
                await t.rollback();
                return res.status(401).json({ error: 'Email ou senha incorretos.' });
            }


            const usuario = await Usuario.findOne({
            where: { id: userToLock.id },
            include: { 
                model: Perfil,
                as: 'Perfils',
                attributes: ['nome_perfil'],
                include: { // Incluindo as permissões de cada perfil
                    model: Permissao,
                    as: 'permissoes',
                    attributes: ['nome'], // Só precisamos do nome da permissão
                }
            },
            transaction: t
        });


            if (!usuario || !(usuario.checkPassword(password))) {
                await t.rollback();
                return res.status(401).json({ error: 'Email ou senha incorretos.' });
            }
            if (!usuario.aprovado) {
                await t.rollback();
                return res.status(403).json({ error: 'Seu cadastro ainda não foi aprovado.' });
            }

            if (usuario.lastSessionId) {
                await sessionStore.destroy(usuario.lastSessionId).catch(err => {
                    console.error("[AVISO] Falha ao tentar destruir a sessão antiga.", err);
                });
            }

             await new Promise(resolve => req.session.regenerate(resolve));

            //  Armazena as informações do usuário na sessão.
            //    O `express-session` salvará isso no banco de dados (via connect-session-sequelize).
            const newSessionId = req.session.id;
            req.session.user = { id: usuario.id, nome: usuario.nome };
            req.session.isValid = true;

            //  Atualiza o usuário com o ID da nova sessão.
            await usuario.update({ lastSessionId: newSessionId }, { transaction: t });
            
            //  Salva a sessão explicitamente antes de enviar a resposta.
            await new Promise(resolve => req.session.save(resolve));
            
            await t.commit();

            // Prepara os dados do usuário para enviar ao frontend.
            const perfis = usuario.Perfils ? usuario.Perfils.map(p => p.nome_perfil) : [];
            const permissionsSet = new Set();
            if (usuario.Perfils) {
                usuario.Perfils.forEach(perfil => {
                    if (perfil.permissoes) {
                        perfil.permissoes.forEach(p => permissionsSet.add(p.nome));
                    }
                });
            }
            const permissions = [...permissionsSet];
            const userPayload = {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfis: perfis,
                permissions: permissions
            };

            //    NÃO enviamos mais o token. O `express-session` já enviou o cookie `connect.sid`
            //    automaticamente através dos cabeçalhos HTTP (`Set-Cookie`).
            res.json({ message: 'Login bem-sucedido', usuario: userPayload });

        } catch (error) {
            if (t.finished !== 'commit' && t.finished !== 'rollback') {
                await t.rollback();
            }
            next(error);
        }
    }


      /**
     * Função de logout que funciona com sessões de cookie.
     */
    async logout(req, res) {
        if (!req.session) {
            return res.status(400).json({ error: 'Nenhuma sessão ativa para encerrar.' });
        }

        req.session.destroy((error) => {
            if (error) {
                console.error("Erro ao destruir a sessão no banco de dados:", error);
                return res.status(500).json({ error: 'Não foi possível fazer logout devido a um erro no servidor.' });
            }
            res.clearCookie('connect.sid'); // Limpa o cookie do navegador.
            return res.status(200).json({ message: 'Logout realizado com sucesso.' });
        });
    }
    async forgotPassword(req, res) {
        const { email } = req.body;

        try {
            const usuario = await Usuario.findOne({ where: { email } });

            // Mensagem genérica por segurança, mesmo se o usuário não existir.
            if (!usuario) {
                console.log(`Tentativa de redefinição para e-mail não existente: ${email}`);
                return res.status(200).json({ message: 'Se um usuário com este e-mail existir, um código de redefinição foi enviado.' });
            }

            // Gera um código numérico de 6 dígitos seguro
            const resetCode = crypto.randomInt(100000, 999999).toString();
            const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');
            const expirationDate = new Date(Date.now() + 10 * 60 * 1000); // Código expira em 10 minutos

            const t = await models.sequelize.transaction();
            try {
                usuario.reset_token = hashedCode;
                usuario.reset_token_expiraem = expirationDate;
                await usuario.save({ transaction: t });

                // Envia o e-mail com o código NÃO-hasheado
                await sendPasswordResetCodeEmail(usuario.email, resetCode);

                await t.commit();
                res.status(200).json({ message: 'Se um usuário com este e-mail existir, um código de redefinição foi enviado.' });

            } catch (innerError) {
                await t.rollback();
                throw innerError;
            }
        } catch (error) {
            console.error('Erro em forgotPassword:', error);
            res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
        }
    }

    async resetPassword(req, res) {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ error: 'E-mail, código e nova senha são necessários.' });
        }

        const t = await models.sequelize.transaction();

        try {
            //  Encontre o usuário pelo EMAIL. É mais seguro e eficiente.
            const usuario = await Usuario.findOne({ where: { email } });

            //  Hash do código recebido para comparar com o do banco.
            const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

            //  Valide se o usuário existe, se o código corresponde e se não expirou.
            if (!usuario || usuario.reset_token !== hashedCode || usuario.reset_token_expiraem < new Date()) {
                await t.commit(); // Finaliza a transação mesmo em caso de falha de validação
                return res.status(400).json({ error: 'Código de redefinição inválido ou expirado.' });
            }

            // O código é válido.
            usuario.password = newPassword; 
            usuario.reset_token = null;
            usuario.reset_token_expiraem = null;
            await usuario.save({ transaction: t });

            await t.commit();
            res.status(200).json({ message: 'Senha redefinida com sucesso! Você já pode fazer o login.' });

        } catch (error) {
            await t.rollback();
            console.error('Erro em resetPassword:', error);
            res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
        }
    }
}

export default new AuthController();