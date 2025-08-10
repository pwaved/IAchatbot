// /middleware/auth.js


import Usuario from '../models/usuario_model.js';
import Perfil from '../models/perfil_model.js';
import Permissao from '../models/permissao_model.js';

/**
 * Middleware Factory para autorização baseada em PERMISSÕES (RBAC).
 * @param {string} requiredPermission - A string da permissão necessária para acessar a rota (ex: 'MANAGE_USERS').
 * @returns Um middleware Express que verifica se o usuário autenticado possui a permissão necessária.
 */
export const authorize = (requiredPermission) => {
    // Retorna a função de middleware real
    return (req, res, next) => {
        // req.user agora deve conter um array 'permissions'
        if (!req.user || !req.user.permissions) {
            return res.status(403).json({ error: 'Acesso negado. As permissões do usuário não puderam ser verificadas.' });
        }

        const userPermissions = req.user.permissions;

        // Verifica se a permissão necessária está na lista de permissões do usuário.
        if (userPermissions.includes(requiredPermission)) {
            return next(); // O usuário tem a permissão, continue.
        }

        // Se não tiver permissão, retorna erro 403.
        return res.status(403).json({ 
            error: `Acesso negado. Requer a permissão: ${requiredPermission}.` 
        });
    };
};


/**
 * Middleware que valida  a sessão, e anexa o usuário COMPLETO
 * (com perfis e permissões) ao objeto `req`.
 */
export const ensureAuthenticated = async (req, res, next) => {
    // O express-session já populou `req.session` a partir do cookie.
    // Verificamos se a sessão existe e se a marcamos como válida durante o login.
    if (req.session && req.session.isValid && req.session.user) {
        try {
            const userId = req.session.user.id;

            // Busca o usuário completo no banco de dados com seus perfis e permissões.
            // Esta lógica é a mesma que você tinha no middleware de token.
            const user = await Usuario.findByPk(userId, {
                include: {
                    model: Perfil,
                    as: 'Perfils',
                    include: {
                        model: Permissao,
                        as: 'permissoes',
                        attributes: ['nome'],
                    },
                },
            });

            if (!user) {
                return res.status(401).json({ error: 'Usuário da sessão não encontrado. Faça login novamente.' });
            }

            // Extrai e formata as permissões.
            const permissionsSet = new Set();
            if (user.Perfils) {
                user.Perfils.forEach(perfil => {
                    if (perfil.permissoes) {
                        perfil.permissoes.forEach(p => permissionsSet.add(p.nome));
                    }
                });
            }

            // Anexa um objeto de usuário limpo ao `req`.
            req.user = {
                id: user.id,
                nome: user.nome,
                email: user.email,
                perfis: user.Perfils.map(p => p.nome_perfil),
                permissions: [...permissionsSet]
            };

            return next(); // Sessão válida, usuário carregado, pode prosseguir.

        } catch (error) {
            console.error('Erro ao carregar dados do usuário da sessão:', error);
            return res.status(500).json({ error: 'Erro interno ao verificar a autenticação.' });
        }
    } else {
        // Se não houver sessão, o acesso é negado.
        return res.status(401).json({ error: 'Acesso não autorizado. Faça login para continuar.' });
    }
};
