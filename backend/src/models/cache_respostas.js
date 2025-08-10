import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const CacheRespostas = sequelize.define('CacheRespostas', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    context_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true
    },
    question_text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    context_text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    answer_text: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'cache_respostas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false 
});

export default CacheRespostas;