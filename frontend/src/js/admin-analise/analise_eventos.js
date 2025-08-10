import { setModalState, getState } from './analise_state.js';
import { fetchAndRenderModalData } from './analise_main.js';
import { showConsultationModal, hideConsultationModal } from './analise_ui.js';
import { showViewDocumentModal, showDocumentFormModal } from '../admin-documentos/documento_modals.js';


function handleModalSubmit(e) {
    e.preventDefault();
    setModalState({
        currentPage: 1,
        filters: {
            searchTerm: document.getElementById('filter-search-term').value,
            feedbackStatus: document.getElementById('filter-feedback-status').value
        }
    });
    fetchAndRenderModalData();
}

function handleModalPagination(e) {
    const { modal } = getState();
    const prevButton = e.target.closest('#prev-page-btn');
    const nextButton = e.target.closest('#next-page-btn');

    if (prevButton && !prevButton.disabled) {
        setModalState({ currentPage: modal.currentPage - 1 });
        fetchAndRenderModalData();
    } else if (nextButton && !nextButton.disabled) {
        setModalState({ currentPage: modal.currentPage + 1 });
        fetchAndRenderModalData();
    }
}

export function setupEventListeners() {
    const content = document.getElementById('analytics-content');
    if (!content || content.dataset.listenerAttached) return;

    content.addEventListener('click', (e) => {
        if (e.target.closest('#view-more-consultations-btn')) {
            showConsultationModal();
            setModalState({ currentPage: 1, filters: {} });
            document.getElementById('consultation-filter-form').reset();
            fetchAndRenderModalData();
        }
    });

    const modal = document.getElementById('consultations-modal');
    if (modal) {
        modal.querySelector('#close-modal-btn')?.addEventListener('click', hideConsultationModal);
        modal.querySelector('#consultation-filter-form')?.addEventListener('submit', handleModalSubmit);
        modal.querySelector('#modal-pagination-controls')?.addEventListener('click', handleModalPagination);
    }

    handleDocumentReviewActions(); 

    content.dataset.listenerAttached = 'true';
}

async function handleDocumentReviewActions() {
    const container = document.getElementById('documents-for-review-list');
    if (!container) return;

    container.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;
        
        // previne outros cliqques
        event.stopPropagation(); 

        switch (action) {
            case 'view':
                await showViewDocumentModal(id);
                break;

            case 'edit':
                await showDocumentFormModal(id);
                break;
        }
    });
}