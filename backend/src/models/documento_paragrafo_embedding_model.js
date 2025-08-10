import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class DocumentoParagrafoEmbedding extends Model {}

DocumentoParagrafoEmbedding.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        documento_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'documentos',
                key: 'id',
            },
        },
        paragrafo_texto: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        embedding: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'DocumentoParagrafoEmbedding',
        tableName: 'documento_paragrafos',
        timestamps: false,
    }
);

export default DocumentoParagrafoEmbedding;
