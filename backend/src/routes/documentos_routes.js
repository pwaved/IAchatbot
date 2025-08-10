import { Router } from 'express';
import DocumentoController from '../controllers/documento_controller.js';
import { ensureAuthenticated, authorize } from '../middleware/auth.js';
import multer from 'multer';

const router = new Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- ROTAS DE LEITURA (Requer permissão para VISUALIZAR) ---
router.get('/', ensureAuthenticated, authorize('VIEW_DOCUMENTS'), DocumentoController.getAll);
router.get('/:id', ensureAuthenticated, authorize('VIEW_DOCUMENTS'), DocumentoController.getById);
router.get('/:id/download', ensureAuthenticated, authorize('VIEW_DOCUMENTS'), DocumentoController.getDocumentFile);

// --- ROTAS DE ESCRITA (Requer permissão para GERENCIAR) ---
router.post('/', ensureAuthenticated , authorize('MANAGE_DOCUMENTS'), upload.single('anexoArquivo'), DocumentoController.create
);

router.put( '/:id', ensureAuthenticated, authorize('MANAGE_DOCUMENTS'), upload.single('anexoArquivo'), DocumentoController.update);

router.delete('/:id', ensureAuthenticated, authorize('MANAGE_DOCUMENTS'), DocumentoController.delete);

router.delete('/:id/anexo', ensureAuthenticated, authorize('MANAGE_DOCUMENTS'), DocumentoController.removeAttachment);

export default router;