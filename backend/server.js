import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { sequelize } from './src/config/database.js';
import authRoutes from './src/routes/auth_routes.js';
import perfilRoutes from './src/routes/perfil_routes.js';
import usuariosRoutes from './src/routes/usuarios_routes.js';
import chatRoutes from './src/routes/chat_routes.js';
import assuntoPendenteRoutes from './src/routes/assuntoPendente_routes.js';
import categoriasRoutes from './src/routes/categorias_routes.js';
import documentoRoutes from './src/routes/documentos_routes.js';
import adminRoutes from './src/routes/admin_routes.js';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import analyticsRoutes from './src/routes/analise_routes.js'
import permissaoRoutes from './src/routes/permissao_routes.js';
import { sess } from './src/middleware/session.js'
import sessionRoutes from './src/routes/session_routes.js'; // Importa as rotas de sessão

const app = express();
const PORT = process.env.PORT || 3000;

// Teste da conexão com o banco de dados
sequelize
  .authenticate()
  .then(() => {
    console.log(' Conexão com o banco de dados estabelecida com sucesso.');
    return sequelize.sync(); 
  })
  .then(() => {
    console.log('Models sincronizados com o banco de dados.');
  })
  .catch((error) => {
    console.error(' Não foi possível conectar ao banco de dados:', error);
  });

// --- Middlewares Globais ---

const corsOptions = {
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, 
  allowedHeaders: ['Content-Type', 'Authorization'] 
};
app.use(cors(corsOptions));
app.use(cookieParser()); // Middleware para parsear cookies
app.use(session(sess));

// --- Body Parsers ---
// Agora, o express.json() só será aplicado às rotas declaradas abaixo dele.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/documentos', documentoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/perfis', perfilRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api', chatRoutes); 
app.use('/api/assuntos-pendentes', assuntoPendenteRoutes);
app.use('/api/categorias', categoriasRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/analise', analyticsRoutes);
app.use('/api/permissoes', permissaoRoutes);
app.use('/api/sessoes', sessionRoutes);

// Inicia o servidor
app.listen(PORT, () => {
  console.log(` Servidor backend rodando em http://localhost:${PORT}`);
});