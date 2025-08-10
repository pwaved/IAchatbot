
import { sessionStore } from '../config/database.js'; // Importa o sessionStore configurado
import dotenv from 'dotenv';
dotenv.config(); // Carrega as variáveis de ambiente do arquivo .env

export const sess = {
    secret: process.env.SESSION_SECRET, // Uma chave secreta forte guardada em .env
    store: sessionStore,
    resave: false, // Não salva a sessão se não for modificada
    saveUninitialized: false, // Não cria sessão até que algo seja armazenado
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 , // Tempo de vida do cookie (ex: 24 horas)
        httpOnly: true, // Previne acesso via JavaScript no cliente
        secure: process.env.NODE_ENV === 'production' // Use cookies seguros em produção (HTTPS)
    }
};
