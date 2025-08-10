import { Router } from 'express';
import AssuntoPendenteController from '../controllers/assuntoPendente_controller.js';
import { ensureAuthenticated, authorize } from '../middleware/auth.js';

const router = new Router();

// A permissão 'MANAGE_PENDING_SUBJECTS' controla o acesso a todas estas rotas.
router.use(ensureAuthenticated, authorize('MANAGE_PENDING_SUBJECTS'));

// --- Rotas de Assuntos Pendentes ---

// GET /api/assuntos-pendentes -> Lista todos os assuntos pendentes
router.get('/', AssuntoPendenteController.getPendentes);

// GET /api/assuntos-pendentes/:id -> Vê os detalhes de um assunto específico
router.get('/:id', AssuntoPendenteController.getById);

// PATCH /api/assuntos-pendentes/:id/status -> Atualiza o status de um assunto
router.patch('/:id/status', AssuntoPendenteController.updateStatus);

// DELETE /api/assuntos-pendentes/:id -> Deleta um assunto pendente
router.delete('/:id', AssuntoPendenteController.delete);

export default router;