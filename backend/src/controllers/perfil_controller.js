import models from '../models/index.js'; // Importa o objeto de modelos
const { Perfil, Usuario, Permissao, sequelize } = models; // Adicione Permissao e sequelize

class PerfilController {
    // Criar um novo perfil 
    async create(req, res) {
        // Usa uma transação para garantir que o perfil e suas permissões sejam criados atomicamente.
        const t = await sequelize.transaction();
        try {
            const { nome_perfil, descricao, permissoes } = req.body; // `permissoes` é um array de IDs
            if (!nome_perfil) {
                return res.status(400).json({ error: 'O nome do perfil é obrigatório.' });
            }
            const novoPerfil = await Perfil.create({ nome_perfil, descricao }, { transaction: t });
            // Se houver permissões enviadas, associa-as ao novo perfil.
            if (permissoes && permissoes.length > 0) {
                await novoPerfil.setPermissoes(permissoes, { transaction: t });
            }
            await t.commit();
            return res.status(201).json(novoPerfil);
        } catch (error) {
            await t.rollback(); // Desfaz a transação em caso de erro
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ error: 'Este nome de perfil já existe.' });
            }
            return res.status(500).json({ error: 'Falha ao criar perfil.', details: error.message });
        }
    }

    async getAll(req, res) {
        try {
            // Ordena por nome para uma visualização mais organizada
            const perfis = await Perfil.findAll({ order: [['nome_perfil', 'ASC']] });
            return res.json(perfis);
        } catch (error) {
            return res.status(500).json({ error: 'Falha ao buscar perfis.', details: error.message });
        }
    }
    

    /**
     * @description Busca um perfil específico pelo ID.
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            // Inclui as permissões associadas ao buscar o perfil.
            const perfil = await Perfil.findByPk(id, {
                include: {
                    model: Permissao,
                    as: 'permissoes',
                    attributes: ['id', 'nome'], // Retorna apenas o ID e nome da permissão
                    through: { attributes: [] } // Não retorna dados da tabela de junção
                }
            });
            if (!perfil) {
                return res.status(404).json({ error: 'Perfil não encontrado.' });
            }
            return res.json(perfil);
        } catch (error) {
            return res.status(500).json({ error: 'Falha ao buscar perfil.', details: error.message });
        }
    }

    /**
     * @description Atualiza um perfil existente.
     */
    async update(req, res) {
        const t = await sequelize.transaction();
        try {
            const { id } = req.params;
            const { nome_perfil, descricao, permissoes } = req.body; // Recebe o array de IDs de permissões

            const perfil = await Perfil.findByPk(id, { transaction: t });
            if (!perfil) {
                return res.status(404).json({ error: 'Perfil não encontrado.' });
            }
            
            await perfil.update({ nome_perfil, descricao }, { transaction: t });
            
            // `setPermissoes` remove as associações antigas e adiciona as novas.
            // Se `permissoes` for um array vazio ou undefined, todas as permissões serão removidas.
            await perfil.setPermissoes(permissoes || [], { transaction: t });

            await t.commit();
            return res.json(perfil);
        } catch (error) {
            await t.rollback();
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ error: 'Este nome de perfil já existe.' });
            }
            return res.status(500).json({ error: 'Falha ao atualizar perfil.', details: error.message });
        }
    }

    /**
     * @description Remove um perfil, verificando antes se ele não está em uso.
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const perfil = await Perfil.findByPk(id, {
                // Incluímos a associação para poder contar os usuários
                include: { model: Usuario, as: 'Usuarios', attributes: ['id'] }
            });

            if (!perfil) {
                return res.status(404).json({ error: 'Perfil não encontrado.' });
            }

            // Verifica se o perfil está associado a algum usuário
            if (perfil.Usuarios && perfil.Usuarios.length > 0) {
                return res.status(409).json({ 
                    error: `Este perfil não pode ser removido, pois está em uso por ${perfil.Usuarios.length} usuário(s).`
                });
            }

            await perfil.destroy();
            return res.status(204).send(); // Sucesso, sem conteúdo para retornar

        } catch (error) {
            return res.status(500).json({ error: 'Falha ao remover perfil.', details: error.message });
        }
    }
      async getAllPublicProfiles(req, res) {
    try {

        const profiles = await Perfil.findAll({
            attributes: ['id', 'nome_perfil'],
            order: [['nome_perfil', 'ASC']] // Adiciona uma ordenação para consistência.
        });
        return res.status(200).json(profiles);
    } catch (error) {
        console.error('Erro ao buscar perfis públicos:', error);
        return res.status(500).json({ error: 'Falha ao buscar perfis públicos.' });
    }
}
}

export default new PerfilController();