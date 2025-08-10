import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class PalavraChave extends Model { }

PalavraChave.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: 'PalavraChave',
    tableName: 'palavras_chaves',
    timestamps: false,
  }
);

export default PalavraChave;