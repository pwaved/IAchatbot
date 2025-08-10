import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Categoria extends Model { }

Categoria.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    
    cor: {
      type: DataTypes.STRING(7),
    },
  },
  {
    sequelize,
    modelName: 'Categoria',
    tableName: 'categorias',
    timestamps: false,
  }
);

export default Categoria;