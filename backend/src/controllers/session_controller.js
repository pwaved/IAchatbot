// controllers/sessionController.js

import models from '../models/index.js';
const { Sessions, Usuario } = models;

/**
 * Busca todas as sessões ativas e inclui os dados do usuário associado.
 */
export const getActiveSessions = async (req, res) => {
    try {
        const sessions = await Sessions.findAll();
        if (!sessions) {
            return res.status(200).json([]);
        }

        // Mapeia as sessões para buscar os dados do usuário
        const activeSessionsPromises = sessions.map(async (session) => {
            // A informação da sessão está em uma string JSON no campo 'data'
            const sessionData = JSON.parse(session.data);

            // Verifica se existe um usuário logado nesta sessão
            if (sessionData && sessionData.user && sessionData.user.id) {
                const usuario = await Usuario.findByPk(sessionData.user.id, {
                    attributes: ['id', 'nome', 'email'] // Busque apenas os campos necessários
                });

                if (usuario) {
                    return {
                        id: session.sid, // O frontend espera um 'id'
                        user: usuario,
                        cookie: sessionData.cookie // Inclui a data de expiração
                    };
                }
            }
            return null; // Retorna nulo se não encontrar usuário ou dados
        });
        
        // Espera todas as buscas terminarem e filtra os resultados nulos
        const detailedSessions = (await Promise.all(activeSessionsPromises))
            .filter(session => session !== null);

        res.status(200).json(detailedSessions);

    } catch (error) {
        console.error("Erro ao buscar sessões ativas:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar sessões.' });
    }
};

/**
 * Deleta (revoga) uma sessão específica pelo seu SID.
 */
export const revokeSession = async (req, res) => {
    try {
        const { sid } = req.params; // Pega o ID da sessão da URL
        const result = await Sessions.destroy({
            where: { sid: sid }
        });

        if (result === 0) {
            return res.status(404).json({ error: 'Sessão não encontrada.' });
        }

        res.status(204).send(); // Sucesso, sem conteúdo

    } catch (error) {
        console.error("Erro ao revogar sessão:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao revogar a sessão.' });
    }
};