import { Router } from 'express';
import AdminController from '../controllers/admin_controller.js';
import { ensureAuthenticated, authorize } from '../middleware/auth.js';

const router = new Router();

// A permissão 'APPROVE_USERS' controla o acesso a estas rotas.
const requiredPermission = 'APPROVE_USERS';

// Rota para buscar usuários com registro pendente
router.get('/users/pending', ensureAuthenticated, authorize(requiredPermission), AdminController.getPendingUsers);

// Rota para aprovar o registro de um usuário
router.patch('/users/:id/approve', ensureAuthenticated, authorize(requiredPermission), AdminController.approveUser);

// Rota para rejeitar/deletar o registro de um usuário
router.delete('/users/:id/reject', ensureAuthenticated, authorize(requiredPermission), AdminController.rejectUser);

export default router;