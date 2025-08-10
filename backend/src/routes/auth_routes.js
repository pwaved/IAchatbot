import { Router } from 'express';
import AuthController from '../controllers/auth_controller.js';
import { ensureAuthenticated } from '../middleware/auth.js';


const router = new Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/logout', ensureAuthenticated , AuthController.logout);
// Rota para verificar o status da sessão e obter dados do usuário
// GET /api/auth/me
router.get('/me', ensureAuthenticated, (req, res) => {
  // O middleware 'ensureAuthenticated' já colocou o usuário em req.user
  // Se a requisição chegou até aqui, a sessão é válida.
  res.json(req.user);
});

export default router;