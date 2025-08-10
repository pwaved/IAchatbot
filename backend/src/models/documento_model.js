// backend/models/documento_model.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import { generateEmbeddingsForDocument, removeEmbeddingsForDocument } from '../utils/embeddingService.js';

class Documento extends Model { }

Documento.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        titulo: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        conteudo: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('Aprovado', 'Pendente', 'Rejeitado'),
            allowNull: false,
            defaultValue: 'Aprovado',
        },
        dataInclusao: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'data_inclusao',
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'updated_at',
        },
        anexo_nome: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'anexo_nome',
        },
        anexo_mimetype: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'anexo_mimetype',
        },
        anexo_arquivo: {
            type: DataTypes.BLOB('long'),
            allowNull: true,
            field: 'anexo_arquivo',
        },
    },
    {
        sequelize,
        modelName: 'Documento',
        tableName: 'documentos',
        timestamps: false,  hooks: {
// Após um documento ser CRIADO e a transação ser confirmada.
            afterCreate: (documento, options) => {
                // Garante que a lógica só rode após o commit da transação principal.
                if (options.transaction) {
                    options.transaction.afterCommit(async () => {
                        if (documento.status === 'Aprovado') {
                            await generateEmbeddingsForDocument(documento);
                        }
                    });
                }
            },

            // Após um documento ser ATUALIZADO e a transação ser confirmada.
            afterUpdate: (documento, options) => {
                if (options.transaction) {
                    options.transaction.afterCommit(async () => {
                        const previousStatus = documento.previous('status');
                        const currentStatus = documento.status;

                        // Caso 1: Foi aprovado
                        if (currentStatus === 'Aprovado' && previousStatus !== 'Aprovado') {
                            await generateEmbeddingsForDocument(documento);
                        }
                        // Caso 2: Deixou de ser aprovado
                        else if (currentStatus !== 'Aprovado' && previousStatus === 'Aprovado') {
                            await removeEmbeddingsForDocument(documento);
                        }
                        // Caso 3: Já era aprovado e o conteúdo mudou
                        else if (currentStatus === 'Aprovado' && options.fields.includes('conteudo')) {
                            await generateEmbeddingsForDocument(documento);
                        }
                    });
                }
            },

            // Após um documento ser DESTRUÍDO e a transação ser confirmada.
            afterDestroy: (documento, options) => {
                if (options.transaction) {
                    options.transaction.afterCommit(async () => {
                        await removeEmbeddingsForDocument(documento);
                    });
                }
            }
        }
    }
);


export default Documento;
