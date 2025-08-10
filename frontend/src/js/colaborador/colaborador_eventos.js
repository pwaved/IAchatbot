// /colaborador/colaborador_eventos.js

import * as state from './colaborador_state.js';
import * as main from './colaborador_main.js';

let searchTimeout;

function handleFilterClick(event) {
    const categoryId = event.target.dataset.categoryId;
    state.setCategoryFilter(categoryId);
    state.setCurrentPage(1);
    main.filterAndRender();
}

function handlePaginationClick(event) {
    const action = event.target.dataset.action || event.target.closest('[data-action]')?.dataset.action;
    let currentPage = state.getCurrentPage();

    if (action === 'prev-page') {
        state.setCurrentPage(--currentPage);
    } else if (action === 'next-page') {
        state.setCurrentPage(++currentPage);
    }
    main.filterAndRender();
}

function handleViewDocumentClick(event) {
    const docId = event.target.dataset.id || event.target.closest('[data-id]')?.dataset.id;
    if (docId) {
        main.showDocumentDetails(docId);
    }
}

function handleDownloadClick(event) {
    event.preventDefault();
    const link = event.target.closest('[data-action="download"]');
    if (link) {
        const { id, name } = link.dataset;
        main.downloadAttachment(id, name);
    }
}

function handleSearchInput(event) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        state.setSearchTerm(event.target.value);
        state.setCurrentPage(1);
        main.filterAndRender();
    }, 300);
}

export function initializeEventListeners() {
    document.addEventListener('click', (event) => {
        const target = event.target;
        if (target.matches('.filter-btn')) {
            handleFilterClick(event);
        } else if (target.closest('[data-action^="prev-"], [data-action^="next-"]')) {
            handlePaginationClick(event);
        } else if (target.closest('[data-action="view"]')) {
            handleViewDocumentClick(event);
        } else if (target.closest('[data-action="download"]')) {
            handleDownloadClick(event);
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.target.id === 'search-docs') {
            handleSearchInput(event);
        }
    });
}