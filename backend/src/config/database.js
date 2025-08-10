import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import session from 'express-session';
import connectSessionSequelize from 'connect-session-sequelize';
import path from 'path'; 
import { fileURLToPath } from 'url'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');

dotenv.config({ path: envPath });

// Exporta a instância do sequelize para ser usada em outros lugares
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  String(process.env.DB_PASSWORD),
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
    dialectOptions: {
    // Define o schema padrão para todas as operações
    searchPath: ['public']
  } 
  }
);

const SequelizeStore = connectSessionSequelize(session.Store);

const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'sessions' // Nome da tabela para armazenar as sessões
});

export const SessionModel = sessionStore.sessionModel;

sessionStore.sync();

export { sequelize, sessionStore };