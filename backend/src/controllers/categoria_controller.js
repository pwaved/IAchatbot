import Categoria from '../models/categoria_model.js';
import Subcategoria from '../models/subcategoria_model.js';
import Documento from '../models/documento_model.js';
import models from '../models/index.js';
import { Op } from 'sequelize';

class CategoriaController {
    async create(req, res) {
        const { nome, descricao, cor, subcategorias } = req.body;
        if (!nome) {
            return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
        }
        const t = await models.sequelize.transaction();
        try {
            const novaCategoria = await Categoria.create({ nome, descricao, cor }, { transaction: t });
            if (subcategorias && Array.isArray(subcategorias) && subcategorias.length > 0) {
                const subcategoriasParaCriar = subcategorias.map(sub => ({
                    nome: sub.nome,
                    cor: sub.cor,
                    categoria_id: novaCategoria.id
                }));
                await Subcategoria.bulkCreate(subcategoriasParaCriar, { transaction: t });
            }
            await t.commit();
            const resultado = await Categoria.findByPk(novaCategoria.id, {
                include: [{
                    model: Subcategoria,
                    as: 'subcategorias', // FIX: Added alias
                    attributes: ['id', 'nome', 'cor']
                }]
            });
            return res.status(201).json(resultado);
        } catch (error) {
            await t.rollback();
            return res.status(500).json({ error: 'Falha ao criar categoria.', details: error.message });
        }
    }

    async getAll(req, res) {
        try {
            const categorias = await Categoria.findAll({
                include: [{
                    model: Subcategoria,
                    as: 'subcategorias',
                    attributes: ['id', 'nome', 'cor']
                }],
                order: [['nome', 'ASC']]
            });

            const categoriasComContagem = await Promise.all(categorias.map(async (cat) => {
                // FIX: Access the included data using the correct alias 'subcategorias'
                const subcategoriaIds = cat.subcategorias.map(sub => sub.id);
                if (subcategoriaIds.length === 0) {
                    return { ...cat.toJSON(), docsCount: 0 };
                }
                const count = await Documento.count({
                    where: {
                        subcategoria_id: {
                            [Op.in]: subcategoriaIds
                        }
                    }
                });
                return { ...cat.toJSON(), docsCount: count };
            }));

            return res.json(categoriasComContagem);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Falha ao buscar categorias.', details: error.message });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const categoria = await Categoria.findByPk(id, {
                include: [{
                    model: Subcategoria,
                    as: 'subcategorias', 
                    attributes: ['id', 'nome', 'cor']
                }]
            });
            if (!categoria) {
                return res.status(404).json({ error: 'Categoria não encontrada.' });
            }
            return res.json(categoria);
        } catch (error) {
            return res.status(500).json({ error: 'Falha ao buscar categoria.', details: error.message });
        }
    }

    async update(req, res) {
        const { id } = req.params;
        const { nome, descricao, cor, subcategorias } = req.body;
        const t = await models.sequelize.transaction();
        try {
            const categoria = await models.Categoria.findByPk(id, { transaction: t });
            if (!categoria) {
                await t.rollback();
                return res.status(404).json({ error: 'Categoria não encontrada.' });
            }
            await categoria.update({ nome, descricao, cor }, { transaction: t });

            if (subcategorias && Array.isArray(subcategorias)) {
                const subcategoriasExistentes = await models.Subcategoria.findAll({ where: { categoria_id: id }, transaction: t });
                const idsExistentes = subcategoriasExistentes.map(sub => sub.id);
                const idsRecebidos = subcategorias.filter(sub => sub.id).map(sub => Number(sub.id));
                const idsParaDeletar = idsExistentes.filter(existingId => !idsRecebidos.includes(existingId));

                if (idsParaDeletar.length > 0) {
                    await models.Documento.destroy({ where: { subcategoria_id: idsParaDeletar }, transaction: t });
                    await models.Subcategoria.destroy({ where: { id: idsParaDeletar }, transaction: t });
                }

                for (const sub of subcategorias) {
                    if (sub.id) {
                        await models.Subcategoria.update({ nome: sub.nome, cor: sub.cor }, { where: { id: Number(sub.id) }, transaction: t });
                    } else {
                        await models.Subcategoria.create({ nome: sub.nome, cor: sub.cor, categoria_id: id }, { transaction: t });
                    }
                }
            }
            await t.commit();
            const categoriaAtualizada = await models.Categoria.findByPk(id, {
                include: [{
                    model: models.Subcategoria,
                    as: 'subcategorias', 
                    attributes: ['id', 'nome', 'cor']
                }]
            });
            return res.json(categoriaAtualizada);
        } catch (error) {
            await t.rollback();
            return res.status(500).json({ error: 'Falha ao atualizar categoria.', details: error.message, stack: error.stack });
        }
    }

    async delete(req, res) {
        const t = await models.sequelize.transaction();
        try {
            const { id } = req.params;
            const categoria = await Categoria.findByPk(id, { transaction: t });
            if (!categoria) {
                await t.rollback();
                return res.status(404).json({ error: 'Categoria não encontrada.' });
            }
            const subcategorias = await Subcategoria.findAll({ where: { categoria_id: id }, transaction: t });
            const subcategoriaIds = subcategorias.map(s => s.id);
            await Documento.destroy({ where: { subcategoria_id: subcategoriaIds }, transaction: t });
            await Subcategoria.destroy({ where: { categoria_id: id }, transaction: t });
            await categoria.destroy({ transaction: t });
            await t.commit();
            return res.status(204).send();
        } catch (error) {
            await t.rollback();
            return res.status(500).json({ error: 'Falha ao deletar categoria.', details: error.message });
        }
    }
}

export default new CategoriaController();