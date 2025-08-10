import { Router } from 'express';
import analyticsController from '../controllers/analise_controller.js';
import { ensureAuthenticated, authorize } from '../middleware/auth.js';

const router = new Router();

// A permissão 'VIEW_DASHBOARD_ANALYTICS' controla todas as rotas de análise.
router.use(ensureAuthenticated, authorize('VIEW_DASHBOARD_ANALYTICS'));

// --- Rotas de Análise ---

// Rota para obter dados de análise de documentos
router.get('/documents', analyticsController.getAnalyticsData);

// Rota para pesquisar em consultas/logs
router.get('/consultations/search', analyticsController.searchConsultations);

export default router;