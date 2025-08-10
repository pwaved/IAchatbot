import { Router } from 'express';
import ChatController from '../controllers/chat_controller.js';
import { ensureAuthenticated } from '../middleware/auth.js';

const router = new Router();

// Todas as rotas abaixo requerem apenas que o usuário esteja autenticado.
// O middleware `tokenWithSession` já faz essa verificação.

// Inicia uma nova sessão de chat
router.post('/sessoes', ensureAuthenticated, ChatController.startSession);

router.get('/faq/popular', ChatController.getPopularQuestions);
// historico de consultas de uma sessão
router.get('/sessoes/:sessao_id/consultas', ensureAuthenticated, ChatController.getHistory);

// Adiciona uma nova consulta (pergunta do usuário) a uma sessão
router.post('/sessoes/:sessao_id/consultas', ensureAuthenticated, ChatController.addConsulta);

// Adiciona feedback a uma consulta específica
router.post('/consultas/:consulta_id/feedbacks', ensureAuthenticated, ChatController.addFeedback);

// Envia uma nova sugestão de tópico para a base de conhecimento
router.post('/assuntos-pendentes', ensureAuthenticated, ChatController.addAssuntoPendente);

router.post('/query', ensureAuthenticated, ChatController.findTopParagraphs);

export default router;