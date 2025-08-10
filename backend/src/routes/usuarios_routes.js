import { Router } from 'express';
import UsuarioController from '../controllers/usuario_controller.js';
import { ensureAuthenticated, authorize } from '../middleware/auth.js';

const router = new Router();

// Aplica o middleware de autenticação para TODAS as rotas deste arquivo.
router.use(ensureAuthenticated);

// Rota para o PRÓPRIO usuário logado atualizar sua senha.
// Não precisa de 'authorize', pois a ação é no próprio usuário.
// `ensureAuthenticated` já garante que temos um `req.user` válido.
router.post('/change-password', UsuarioController.updatePasswordUser);

// --- Rotas de Gerenciamento (Requer permissão para GERENCIAR USUÁRIOS) ---
const requiredPermission = 'MANAGE_USERS';

// Rota para listar todos os usuários
router.get('/', authorize(requiredPermission), UsuarioController.getAll);

// Rota para criar um novo usuário
router.post('/', authorize(requiredPermission), UsuarioController.create);

// Rota para obter um usuário específico
router.get('/:id', authorize(requiredPermission), UsuarioController.getById);

// Rota para atualizar um usuário
router.put('/:id', authorize(requiredPermission), UsuarioController.update);

// Rota para deletar um usuário
router.delete('/:id', authorize(requiredPermission), UsuarioController.delete);

export default router;