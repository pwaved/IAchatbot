import { Router } from 'express';
import CategoriaController from '../controllers/categoria_controller.js';
import { ensureAuthenticated, authorize } from '../middleware/auth.js';

const router = new Router();

// --- Rotas de Leitura (Requer permissão para VISUALIZAR) ---
// Acessível por Colaborador e Administrador, pois ambos possuem a permissão 'VIEW_CATEGORIES'
router.get('/', ensureAuthenticated, authorize('VIEW_CATEGORIES'), CategoriaController.getAll);
router.get('/:id', ensureAuthenticated, authorize('VIEW_CATEGORIES'), CategoriaController.getById);


// --- Rotas de Escrita (Requer permissão para GERENCIAR) ---
// Acessível SOMENTE por quem tem a permissão 'MANAGE_CATEGORIES' (neste caso, Administrador)
router.post('/', ensureAuthenticated, authorize('MANAGE_CATEGORIES'), CategoriaController.create);
router.put('/:id', ensureAuthenticated, authorize('MANAGE_CATEGORIES'), CategoriaController.update);
router.delete('/:id', ensureAuthenticated, authorize('MANAGE_CATEGORIES'), CategoriaController.delete);

export default router;