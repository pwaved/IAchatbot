import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';


class Perfil extends Model {}

Perfil.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome_perfil: {
      type: DataTypes.STRING, // Trocado de ENUM para STRING
      allowNull: false,
      unique: true,
    },
    descricao: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'Perfil',
    tableName: 'perfis',
    timestamps: false,
  }
);

export default Perfil;