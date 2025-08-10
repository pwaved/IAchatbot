import models from '../models/index.js';

const { AssuntoPendente, sequelize } = models;

/**
 * @class AssuntoPendenteController
 * @desc  Gerenciador de topicos assuntos pendentes
 */
class AssuntoPendenteController {
    /**
     * @desc     
     * @route    GET /api/assuntos-pendentes
     * @access   AUTH/Admin
     */
    async getPendentes(req, res, next) {
        try {
            const assuntos = await AssuntoPendente.findAll({
                where: { status: 'Aberto' },
                order: [['datahora_sugestao', 'ASC']], // ASC OU DESC
            });
            res.json(assuntos);
        } catch (error) {
            console.error("Error fetching pending topics:", error);
            // passa o erro para o middleware
            next(error);
        }
    }

    /**
     * @desc     Um unico topico pendente
     * @route    GET /api/assuntos-pendentes/:id
     * @access   AUTH/Admin
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const assunto = await AssuntoPendente.findByPk(id);

            if (!assunto) {
                return res.status(404).json({ message: 'Assunto pendente não encontrado.' });
            }

            res.json(assunto);
        } catch (error) {
            console.error("Error fetching pending topic by ID:", error);
            next(error);
        }
    }

    /**
     * @desc     atualiza o status de um assunto pendente
     * @route    PATCH /api/assuntos-pendentes/:id/status
     * @access   AUTH/Admin
     */
    async updateStatus(req, res, next) {
        const { id } = req.params;
        const { status } = req.body;

        // valida status primeiro
        if (!status || !['Em Análise', 'Resolvido', 'Rejeitado'].includes(status)) {
            return res.status(400).json({ message: 'Status inválido fornecido.' });
        }

        const t = await sequelize.transaction();

        try {
            const assunto = await AssuntoPendente.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });

            if (!assunto) {
                await t.rollback();
                return res.status(404).json({ message: 'Assunto pendente não encontrado.' });
            }

            assunto.status = status;
            await assunto.save({ transaction: t });

            await t.commit();

            res.json(assunto);
        } catch (error) {
            await t.rollback();
            console.error("Error updating pending topic status:", error);
            next(error);
        }
    }

    /**
     * @desc     Deleta 
     * @route    DELETE /api/assuntos-pendentes/:id
     * @access   AUTH/Admin
     */
    async delete(req, res, next) {
        const { id } = req.params;
        const t = await sequelize.transaction();

        try {
            const assunto = await AssuntoPendente.findByPk(id, { transaction: t });

            if (!assunto) {
                await t.rollback();
                return res.status(404).json({ message: 'Assunto pendente não encontrado.' });
            }

            await assunto.destroy({ transaction: t });
            await t.commit();

            res.status(200).json({ message: 'Assunto pendente deletado com sucesso.' });
        } catch (error) {
            await t.rollback();
            console.error("Error deleting pending topic:", error);
            next(error);
        }
    }
}

export default new AssuntoPendenteController();