import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class AssuntoPendente extends Model { }

AssuntoPendente.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // fk 'consulta_id' é adicionada via associações
    texto_assunto: {
      type: DataTypes.TEXT,
    },
     status: {
      type: DataTypes.ENUM('Aberto', 'Resolvido'),
      allowNull: false,
      defaultValue: 'Aberto',
    },
    datahora_sugestao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // A categoria pode ser nula
      references: {
        model: 'categorias',
        key: 'id'
      }
    },
    subcategoria_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // A subcategoria pode ser nula
      references: {
        model: 'subcategorias',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    modelName: 'AssuntoPendente',
    tableName: 'assuntos_pendentes',
    timestamps: false,
  }
);

export default AssuntoPendente;