import { Router } from 'express';
import PerfilController from '../controllers/perfil_controller.js';
import { ensureAuthenticated, authorize } from '../middleware/auth.js';

const router = new Router();
const requiredPermission = 'MANAGE_PROFILES';

// --- Rotas Públicas ---
router.get('/public', PerfilController.getAllPublicProfiles);

// --- Rotas Protegidas (Requer permissão para GERENCIAR PERFIS) ---
router.get('/', ensureAuthenticated, authorize(requiredPermission), PerfilController.getAll);
router.get('/:id', ensureAuthenticated, authorize(requiredPermission), PerfilController.getById); 
router.post('/', ensureAuthenticated, authorize(requiredPermission), PerfilController.create);
router.put('/:id', ensureAuthenticated, authorize(requiredPermission), PerfilController.update); 
router.delete('/:id', ensureAuthenticated, authorize(requiredPermission), PerfilController.delete); 

export default router;