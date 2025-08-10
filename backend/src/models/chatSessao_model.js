import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class ChatSessao extends Model { }

ChatSessao.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // a fk 'usuario_id' será adicionada pelas associações
    datahora_inicio: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    datahora_fim: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: 'ChatSessao',
    tableName: 'chat_sessoes',
    timestamps: false,
  }
);

export default ChatSessao;