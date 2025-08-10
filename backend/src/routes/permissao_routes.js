import { Router } from 'express';
import PermissaoController from '../controllers/permissao_controller.js';
import { ensureAuthenticated, authorize } from '../middleware/auth.js';

const router = new Router();

// Apenas usuários com permissão para gerenciar perfis podem ver a lista de permissões.
router.get('/', ensureAuthenticated, authorize('MANAGE_PROFILES'), PermissaoController.getAll);

export default router;