import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';


class Subcategoria extends Model {}

Subcategoria.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    cor: {
  type: DataTypes.STRING(7),
},
    // A chave estrangeira 'categoria_id' será adicionada pelas associações
  },
  {
    sequelize,
    modelName: 'Subcategoria',
    tableName: 'subcategorias',
    timestamps: false,
  }
);

export default Subcategoria;