import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class ChatResposta extends Model { }

ChatResposta.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // fks 'consulta_id' e 'documento_fonte_id' adicionadas via associações
    texto_resposta: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    datahora_resposta: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ChatResposta',
    tableName: 'chat_respostas',
    timestamps: false,
  }
);

export default ChatResposta;