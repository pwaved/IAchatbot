// routes/sessionRoutes.js

import express from 'express';
import { getActiveSessions, revokeSession } from '../controllers/session_controller.js';
import { ensureAuthenticated } from '../middleware/auth.js'; // Supondo que você tenha esses middlewares

const router = express.Router();

// GET /api/sessoes/ativas - Lista todas as sessões ativas
router.get(
    '/ativas',
    ensureAuthenticated, // Garante que o usuário está logado     // Garante que é um administrador
    getActiveSessions
);

// DELETE /api/sessoes/:sid - Revoga uma sessão específica
router.delete(
    '/:sid',
    ensureAuthenticated,
    revokeSession
);

export default router;