import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Feedback extends Model { }

Feedback.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // fk 'consulta_id' adicionada via associações
    satisfatorio: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    
    datahora_feedback: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Feedback',
    tableName: 'feedbacks',
    timestamps: false,
  }
);

export default Feedback;