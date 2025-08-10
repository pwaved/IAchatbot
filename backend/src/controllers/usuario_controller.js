import Usuario from '../models/usuario_model.js';
import Perfil from '../models/perfil_model.js';
import models from '../models/index.js';


class UsuarioController {
  async getProfile(req, res) {
    // Buscar perfil do usuário autenticado
    try {
      const usuario = await Usuario.findByPk(req.usuario.id, {
        attributes: ['id', 'nome', 'email'],
        include: [{
          model: Perfil,
          attributes: ['nome_perfil'],
          through: { attributes: [] }
        }]
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const perfis = usuario.Perfils.map(p => p.nome_perfil);

      return res.json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfis,
        message: `Olá, ${usuario.nome}!`
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar perfil.' });
    }
  }

  // Atualizar perfil (só o próprio usuário)
  async updateProfile(req, res) {
    try {
      const { nome } = req.body;
      const userId = req.usuario.id; // Vem do middleware

      const usuario = await Usuario.findByPk(userId);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      await usuario.update({ nome });

      return res.json({ message: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const usuario = await Usuario.findByPk(id, {
        attributes: ['id', 'nome', 'email'],
        include: [{ model: Perfil,as: 'Perfils', attributes: ['id', 'nome_perfil'] }]
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      return res.json(usuario);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }
  }

  // Listar todos os usuários (só admin)
  async getAll(req, res) {
    try {
      const usuarios = await Usuario.findAll({
        attributes: ['id', 'nome', 'email', 'aprovado'],
        include: [{
          model: Perfil, // Diz ao Sequelize para incluir o model Perfil
          attributes: ['nome_perfil'],
          as: 'Perfils', // Pega apenas o nome do perfil
          through: { attributes: [] } // Essencial para N-M: não traz os dados da tabela de junção (usuario_perfis)
        }],
        order: [['nome', 'ASC']] // Opcional: ordena por nome
      });

      // Não é mais necessário formatar aqui, o frontend já faz isso.
      // Apenas retornamos os dados completos que o Sequelize nos deu.
      return res.json(usuarios);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
  }
  async create(req, res) {
    const t = await models.sequelize.transaction();
    try {
      const { nome, email, password, perfil_id } = req.body;

      if (!nome || !email || !password || !perfil_id) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios: nome, email, password, perfil_id.' });
      }

      // O model irá usar o setter para fazer o hash da senha automaticamente
      const novoUsuario = await Usuario.create({ nome, email, password, aprovado: true }, { transaction: t });
      const perfil = await Perfil.findByPk(perfil_id);
      if (!perfil) {
        await t.rollback();
        return res.status(400).json({ error: 'Perfil inválido.' });
      }

      await novoUsuario.setPerfils([perfil], { transaction: t });

      await t.commit();

      // Retorna o usuário criado sem a senha
      const usuarioParaRetorno = await Usuario.findByPk(novoUsuario.id, {
        attributes: ['id', 'nome', 'email'],
        include: [{ model: Perfil,as: 'Perfils', attributes: ['nome_perfil'] }]
      });

      return res.status(201).json(usuarioParaRetorno);

    } catch (error) {
      await t.rollback();
      console.error("Erro ao criar usuário:", error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Email já em uso.' });
      }
      return res.status(500).json({ error: 'Falha ao criar usuário.' });
    }
  }

  async update(req, res) {
    const t = await models.sequelize.transaction();
    try {
      const { id } = req.params;
      // Adicionamos 'password' à desestruturação
      const { nome, email, perfil_id, password } = req.body;

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      // Prepara o objeto de dados para atualização
      const updateData = { nome, email };

      // SÓ ADICIONA A SENHA SE ELA FOI ENVIADA
      if (password && password.length > 0) {
        // O setter VIRTUAL no model cuidará do hashing
        updateData.password = password;
      }

      await usuario.update(updateData, { transaction: t });

      if (perfil_id) {
        const perfil = await Perfil.findByPk(perfil_id);
        if (!perfil) {
          await t.rollback();
          return res.status(400).json({ error: 'Perfil inválido.' });
        }
        await usuario.setPerfils([perfil], { transaction: t });
      }

      await t.commit();

      const usuarioAtualizado = await Usuario.findByPk(id, {
        include: [{ model: Perfil, as: 'Perfils', attributes: ['nome_perfil'], through: { attributes: [] } }]
      });

      return res.json(usuarioAtualizado);

    } catch (error) {
      await t.rollback();
      console.error("Erro ao atualizar usuário:", error);

      let errorMessage = 'Falha ao atualizar usuário.';
      let details = 'Ocorreu um erro inesperado ao tentar atualizar o usuário.';
      let validationErrors = [];

      // checa por erros especificos e retorna uma mensagem para o usuario
      if (error.name === 'SequelizeUniqueConstraintError') {
        errorMessage = 'Email já em uso.';
        details = 'O email fornecido já está registrado por outro usuário. Por favor, utilize um email diferente.';
        // Extract specific field errors if available
        if (error.errors && error.errors.length > 0) {
          validationErrors = error.errors.map(err => ({
            field: err.path,
            message: `O campo '${err.path}' já possui um valor existente.`
          }));
        }
      } else if (error.name === 'SequelizeValidationError') {
        errorMessage = 'Dados inválidos.';
        details = 'Alguns dos dados fornecidos são inválidos. Por favor, verifique os campos e tente novamente.';
        if (error.errors && error.errors.length > 0) {
          validationErrors = error.errors.map(err => ({
            field: err.path,
            message: `Erro no campo '${err.path}': ${err.message}`
          }));
        }
      } else {
        errorMessage = 'Erro interno do servidor.';
        details = error.message || 'Ocorreu um erro inesperado no servidor. Tente novamente mais tarde.';
      }

      // erro detalhado caso a resposta seja 500
      return res.status(500).json({
        error: errorMessage,
        details: details,
        validationErrors: validationErrors
      });
    }
  }

/**
     * Permite que o usuário LOGADO altere sua própria senha.
     * A função espera o ID do usuário vindo do middleware de autenticação (req.user.id).
     *
     */
    async updatePasswordUser(req, res) {
        // O ID do usuário é obtido do token, garantindo que ele só pode alterar a própria senha.
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;


        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'A senha atual e a nova senha são obrigatórias.' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'A nova senha deve ter no mínimo 8 caracteres.' });
        }

        try {
            //  Busca o usuário no banco de dados usando Sequelize
            const user = await models.Usuario.findByPk(userId);

            if (!user) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }
            //  Verifica se a senha atual está correta
            const isPasswordCorrect = await user.checkPassword(currentPassword);
            if (!isPasswordCorrect) {
                return res.status(401).json({ message: 'A senha atual está incorreta.' });
            }
            //  Atribui a nova senha. O hook 'beforeSave' no seu model deve cuidar da criptografia.
            user.password = newPassword;
            //  Salva a instância do usuário com a senha atualizada
            await user.save();
            return res.status(200).json({ message: 'Senha alterada com sucesso!' });

        } catch (error) {
            console.error('Erro ao alterar a senha:', error);
            return res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
        }
    };


  async delete(req, res, next) { 
    try {
      // CAMADA DE DEFESA FINAL: Verifica se 'req.user' existe.
      // Se o middleware falhar por qualquer motivo, esta linha impede o crash.
      if (!req.user || typeof req.user.id === 'undefined') {
        console.error("ERRO CRÍTICO: O controller 'delete' foi alcançado sem um usuário autenticado.");
        return res.status(401).json({ error: 'Falha na autenticação antes da operação.' });
      }

      const { id } = req.params;
      const idParaDeletar = parseInt(id, 10);
      const idDoAdminLogado = req.user.id;

      if (idParaDeletar === idDoAdminLogado) {
        return res.status(403).json({ error: 'Você não pode remover sua própria conta de administrador.' });
      }

      const usuario = await Usuario.findByPk(idParaDeletar);

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado para exclusão.' });
      }

      await usuario.destroy();
      return res.status(204).send();

    } catch (error) {
      // Em vez de retornar um JSON genérico, passe para um handler de erro global.
      next(error);
    }
  }
}
export default new UsuarioController();