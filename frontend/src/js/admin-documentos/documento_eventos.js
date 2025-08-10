import { hasPermission, isLoggedIn } from '../auth/auth_state.js';
import { handleApiError, showPermissionDeniedModal } from '../../utils/error-handle.js';
import { debounce } from '../../utils/debounce.js'
import { getState, setState } from './documento_state.js';
import { filterAndRenderDocuments } from './documento_main.js';
import { showDocumentFormModal, showDeleteConfirmationModal, showViewDocumentModal, showPendingTopicsModal } from './documento_modals.js';
import { downloadDocumentAttachment } from '../../api/apiDocumentos.js';
import { triggerBrowserDownload } from '../../utils/download.js';

/**
 *  Lida com a solicitação de download de um anexo de documento.
 * @param {string} documentId - O ID do documento.
 * @param {string} fileName - O nome do arquivo para download.
 */
async function handleDownload(documentId, fileName) {
    if (!isLoggedIn()) {
        showPermissionDeniedModal(); 
        return;
    }

    try {
        const blob = await downloadDocumentAttachment(documentId);
        triggerBrowserDownload(blob, fileName);
    } catch (error) {
        handleApiError(error); 
    }
}

/**
 * Manipulador central de cliques, usando delegação de eventos.
 * @param {Event} event - O objeto do evento de clique.
 */
function handleClick(event) {
    const target = event.target;
    const actionTarget = target.closest('[data-action]');
    if (!actionTarget) return;

    const action = actionTarget.dataset.action;
    const id = actionTarget.dataset.id;

    switch (action) {
        case 'add':
            if (!hasPermission('MANAGE_DOCUMENTS')) return showPermissionDeniedModal();
            showDocumentFormModal();
            break;

        case 'edit':
            if (!hasPermission('MANAGE_DOCUMENTS')) return showPermissionDeniedModal();
            showDocumentFormModal(id);
            break;

        case 'view':
            if (!hasPermission('VIEW_DOCUMENTS')) return showPermissionDeniedModal();
            showViewDocumentModal(id);
            break;

        case 'delete':
            if (!hasPermission('MANAGE_DOCUMENTS')) return showPermissionDeniedModal();
            const title = actionTarget.dataset.docTitle;
            showDeleteConfirmationModal(id, title);
            break;

        case 'download':
            event.preventDefault();
            if (!hasPermission('VIEW_DOCUMENTS')) return showPermissionDeniedModal();
            const fileName = actionTarget.dataset.name;
            handleDownload(id, fileName);
            break;

        case 'show-pending':
            if (!hasPermission('MANAGE_PENDING_SUBJECTS')) return showPermissionDeniedModal();
            showPendingTopicsModal();
            break;

        case 'filter-category':
            const categoryId = actionTarget.dataset.categoryId;
            setState({ currentCategoryFilter: categoryId, currentPage: 1 });
            filterAndRenderDocuments();
            break;

        case 'prev-page':
            const { currentPage: prevPage } = getState();
            if (prevPage > 1) {
                setState({ currentPage: prevPage - 1 });
                filterAndRenderDocuments();
            }
            break;

        case 'next-page': {
            const { currentPage: nextPage } = getState();
            setState({ currentPage: nextPage + 1 });
            filterAndRenderDocuments();
            break;
        }
    }
}

/**
 * Manipulador para o input de busca com debounce.
 */
const handleSearch = debounce((event) => {
    setState({ currentSearchTerm: event.target.value.trim(), currentPage: 1 });
    filterAndRenderDocuments();
});

/**
 * Configura os event listeners globais para a aba de documentos.
 */
export function setupEventListeners() {
    const documentsContent = document.getElementById('documents-content');
    if (!documentsContent || documentsContent.dataset.listenerAttached) return;

    documentsContent.addEventListener('click', handleClick);

    documentsContent.addEventListener('keyup', (event) => {
        if (event.target.id === 'search-docs') {
            handleSearch(event);
        }
    });

    documentsContent.dataset.listenerAttached = 'true';
}