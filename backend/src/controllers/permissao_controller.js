import models from '../models/index.js';
const { Permissao } = models;

class PermissaoController {
    /**
     * @description Lista todas as permissões disponíveis no sistema.
     */
    async getAll(req, res) {
        try {
            const permissoes = await Permissao.findAll({ order: [['descricao', 'ASC']] });
            res.json(permissoes);
        } catch (error) {
            res.status(500).json({ error: 'Falha ao buscar permissões.', details: error.message });
        }
    }
}

export default new PermissaoController();