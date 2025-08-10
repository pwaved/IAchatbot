import models from '../models/index.js';
import PalavraChave from '../models/palavrachave_model.js';
import Usuario from '../models/usuario_model.js';
import Documento from '../models/documento_model.js';
import Subcategoria from '../models/subcategoria_model.js';
import Categoria from '../models/categoria_model.js';

// --- IMPORTAÇÕES PARA CACHE E EMBEDDINGS ---
import { invalidateCacheForDocument } from '../utils/cacheInvalidationService.js';
import { generateEmbeddingsForDocument, removeEmbeddingsForDocument } from '../utils/embeddingService.js';

const sequelize = models.sequelize;
// função auxiliar para com os relacionamentos e atributos padrão
const defaultDocumentIncludes = [
    { model: PalavraChave, as: 'PalavraChaves', attributes: ['id', 'nome'] },
    {
        model: Subcategoria,
        as: 'subcategoria',
        attributes: ['id', 'nome', 'cor'],
        include: {
            model: Categoria,
            as: 'categoria',
            attributes: ['id', 'nome', 'cor']
        }
    },
    { model: Usuario, as: 'autor', attributes: ['id', 'nome'] }
];
// Helper method para atualizar as palavras-chaves
async function updateDocumentKeywords(document, keywordNames, transaction) {
    if (!keywordNames || keywordNames.length === 0) {
        await document.setPalavraChaves([], { transaction });
        return;
    }
    const keywordInstances = await Promise.all(
        keywordNames.map(async (name) => {
            const [keyword] = await PalavraChave.findOrCreate({
                where: { nome: name },
                defaults: { nome: name },
                transaction
            });
            return keyword;
        })
    );
    await document.setPalavraChaves(keywordInstances, { transaction });
}

class DocumentoController {
    // --- Criar um novo documento ---
     async create(req, res) {
        let transaction;
        try {
            const { titulo, subcategoriaId, conteudo, keywordNames, anexos } = req.body;
            transaction = await sequelize.transaction();
            const dataToCreate = {
                titulo,
                subcategoria_id: subcategoriaId,
                conteudo,
                anexos: anexos ? JSON.parse(anexos) : [],
                autor_id: req.user.id,
            };
            if (req.file) {
                dataToCreate.anexo_nome = req.file.originalname;
                dataToCreate.anexo_mimetype = req.file.mimetype;
                dataToCreate.anexo_arquivo = req.file.buffer;
            }
            const document = await Documento.create(dataToCreate, { transaction });
            const parsedKeywordNames = keywordNames ? JSON.parse(keywordNames) : [];
            await updateDocumentKeywords(document, parsedKeywordNames, transaction);
            await transaction.commit();

            if (document.status === 'Aprovado') {
                await generateEmbeddingsForDocument(document);
            }

            const createdDocumentWithIncludes = await Documento.findByPk(document.id, {
                include: defaultDocumentIncludes 
            });
            res.status(201).json(createdDocumentWithIncludes);
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error('Error creating document:', error);
            res.status(500).json({ error: 'Failed to create document', details: error.message });
        }
    }

    async getDocumentFile(req, res) {
        try {
            const { id } = req.params;
            const doc = await Documento.findByPk(id, {
                attributes: ['anexo_nome', 'anexo_mimetype', 'anexo_arquivo']
            });
            if (!doc || !doc.anexo_arquivo) {
                return res.status(404).send('Arquivo não encontrado para este documento.');
            }
            res.setHeader('Content-Type', doc.anexo_mimetype);
            res.setHeader('Content-Disposition', `attachment; filename="${doc.anexo_nome}"`);
            res.send(doc.anexo_arquivo);
        } catch (error) {
            console.error('Error fetching document file:', error);
            res.status(500).json({ error: 'Failed to download file', details: error.message });
        }
    }

    // --- Listar todos os documentos ---
   async getAll(req, res) {
        try {
            const documents = await Documento.findAll({
                attributes: { exclude: ['anexo_arquivo'] },
                include: defaultDocumentIncludes 
            });
            res.status(200).json(documents);
        } catch (error) {
            console.error('Error fetching documents:', error);
            res.status(500).json({ error: 'Failed to fetch documents', details: error.message });
        }
    } 

    // --- Buscar um documento pelo ID ---
    async getById(req, res) {
        try {
            const { id } = req.params;
            const document = await Documento.findByPk(id, {
                include: defaultDocumentIncludes 
            });
            if (!document) {
                return res.status(404).json({ message: 'Document not found' });
            }
            res.status(200).json(document);
        } catch (error) {
            console.error('Error fetching single document:', error);
            res.status(500).json({ error: 'Failed to fetch document', details: error.message });
        }
    }

    // --- Atualizar um documento ---
    async update(req, res) {
        let transaction;
        try {
            const { id } = req.params;
            const { titulo, subcategoriaId, conteudo, keywordNames, anexos, status } = req.body;
            
            transaction = await sequelize.transaction();
            const document = await Documento.findByPk(id, { transaction });
            
            if (!document) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Document not found' });
            }

            await invalidateCacheForDocument(id);
            await removeEmbeddingsForDocument(document);

            const dataToUpdate = {
                titulo,
                subcategoria_id: subcategoriaId,
                conteudo,
                anexos: anexos ? JSON.parse(anexos) : document.anexos,
                status: status || document.status,
            };
            
            if (req.file) {
                dataToUpdate.anexo_nome = req.file.originalname;
                dataToUpdate.anexo_mimetype = req.file.mimetype;
                dataToUpdate.anexo_arquivo = req.file.buffer;
            }
            
            await document.update(dataToUpdate, { transaction });
            
            const parsedKeywordNames = keywordNames ? JSON.parse(keywordNames) : [];
            await updateDocumentKeywords(document, parsedKeywordNames, transaction);
            
            await transaction.commit();

            if (document.status === 'Aprovado') {
                await generateEmbeddingsForDocument(document);
            }

            const updatedDocumentWithIncludes = await Documento.findByPk(document.id, {
                include: defaultDocumentIncludes // <-- ATUALIZADO
            });
            
            res.status(200).json(updatedDocumentWithIncludes);
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error('Error updating document:', error);
            res.status(500).json({ error: 'Failed to update document', details: error.message });
        }
    }

    
    // --- Deletar um documento ---
    async delete(req, res) {
        try {
            const { id } = req.params;
            const documento = await Documento.findByPk(id);
            if (!documento) {
                return res.status(404).json({ error: 'Documento não encontrado.' });
            }

            // --- LÓGICA DE CACHE E EMBEDDING  ---
            // 1. Invalida qualquer cache associado antes de deletar.
            await invalidateCacheForDocument(id);
            // 2. Remove os embeddings permanentemente.
            await removeEmbeddingsForDocument(documento);


            await documento.destroy();
            
            return res.status(204).send();
        } catch (error) {
            console.error('Falha ao deletar documento:', error);
            return res.status(500).json({ error: 'Falha ao deletar documento.', details: error.message });
        }
    }


    // --- Remover o anexo de um documento ---
    async removeAttachment(req, res) {
        let transaction;
        try {
            const { id } = req.params;
            transaction = await sequelize.transaction();

            const document = await Documento.findByPk(id, { transaction });

            if (!document) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Document not found' });
            }

            if (!document.anexo_nome) {
                await transaction.rollback();
                return res.status(400).json({ message: 'Document does not have an attachment to remove' });
            }

            await invalidateCacheForDocument(id);
            await removeEmbeddingsForDocument(document);

            document.anexo_nome = null;
            document.anexo_mimetype = null;
            document.anexo_arquivo = null;
            await document.save({ transaction });

            await transaction.commit();

            if (document.status === 'Aprovado') {
                await generateEmbeddingsForDocument(document);
            }
            
            const updatedDocument = await Documento.findByPk(id, {
                include: defaultDocumentIncludes, 
                attributes: { exclude: ['anexo_arquivo'] }
            });

            res.status(200).json({ message: 'Attachment removed successfully', document: updatedDocument });

        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error('Error removing attachment:', error);
            res.status(500).json({ error: 'Failed to remove attachment', details: error.message });
        }
    }
}
export default new DocumentoController();