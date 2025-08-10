import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Permissao extends Model {}

Permissao.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Nome único da permissão, ex: MANAGE_USERS',
    },
    descricao: {
      type: DataTypes.TEXT,
      comment: 'Descrição do que a permissão faz',
    },
  },
  {
    sequelize,
    modelName: 'Permissao',
    tableName: 'permissoes',
    timestamps: false,
  }
);

export default Permissao;