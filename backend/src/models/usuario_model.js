import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';

class Usuario extends Model {
 checkPassword(password) {
    
    if (!this.senha_hash) {
       
        return false; // nao compara se nao existe um hash 
    }
    return bcrypt.compareSync(password, this.senha_hash); 
  }
}


Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    // Campo VIRTUAL para receber a senha do frontend e gerar o hash
    password: {
      type: DataTypes.VIRTUAL,
      set(value) {
        const salt = bcrypt.genSaltSync(10);
        this.setDataValue('senha_hash', bcrypt.hashSync(value, salt));
      },
    },
    senha_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },aprovado: { 
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false, // valor padrao = falso(nao aprovado)
  },
  reset_token: {
      type: DataTypes.STRING,
      allowNull: true, // nulo a maior parte do tempo
    },
    reset_token_expiraem: {
      type: DataTypes.DATE,
      allowNull: true, // nulo a maior parte do tempo
    },
    lastSessionId: {
        type: DataTypes.STRING,
        allowNull: true, // Permite que seja nulo (ex: para utilizadores que nunca fizeram login)
        field: 'lastsessionid', // Nome do campo no banco de dados
    },
  },

  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: false, 
    hooks: {
    
  }
});


export default Usuario;