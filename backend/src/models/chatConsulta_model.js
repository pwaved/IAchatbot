import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class ChatConsulta extends Model { }

ChatConsulta.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // a fk 'sessao_id' será adicionada pelas associações
    texto_consulta: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    datahora_consulta: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ChatConsulta',
    tableName: 'chat_consultas',
    timestamps: false,
  }
);

export default ChatConsulta;