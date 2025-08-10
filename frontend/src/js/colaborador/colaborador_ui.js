import Modal from '../../componentes/modal.js';
import { ICONS } from '../../utils/icons.js';
import * as state from './colaborador_state.js';

export function buildLayout() {
    const mainContainer = document.querySelector('#app main'); 
    mainContainer.innerHTML = `
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-8">
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <span class="text-brand-green">${ICONS.bookOpen}</span>
                    <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-green to-emerald-600 bg-clip-text text-transparent dark:to-emerald-400">
                        Explore a Base de Conhecimento
                    </h1>
                </div>
                <p class="text-neutral-600 dark:text-neutral-400 max-w-2xl">
                    Utilize os filtros e a busca para encontrar informações e procedimentos rapidamente.
                </p>
            </div>
            <a href="/" class="flex-shrink-0 text-sm font-medium text-brand-green hover:text-brand-darkgreen dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-2">
                ${ICONS.backArrow}<span>Voltar ao Chat</span>
            </a>
        </div>
        <div class="mb-6 space-y-4">
            <div id="filters-container"></div>
            <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-500 dark:text-neutral-400">${ICONS.search}</span>
                <input type="text" id="search-docs" placeholder="Buscar por título, conteúdo ou palavras-chave..." class="w-full pl-11 pr-4 dark:text-neutral-300 bg-white dark:bg-gray-800 border border-neutral-300 dark:border-neutral-600 rounded-lg py-3 shadow-sm">
            </div>
        </div>
        <div id="documents-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"></div>
        <div id="pagination-container" class="mt-8 py-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400"></div>
    `;
}

export function renderFilterButtons() {
    const categories = Object.values(state.getCategories());
    const container = document.getElementById('filters-container');
    if (!container) return;
    container.innerHTML = `
        <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Filtrar por Categoria:</span>
            <button data-category-id="" class="filter-btn px-3 py-1 rounded-full text-sm font-medium border transition">Todas</button>
            ${categories.map(cat => `<button data-category-id="${cat.id}" class="filter-btn px-3 py-1 rounded-full text-sm font-medium border transition">${cat.nome}</button>`).join('')}
        </div>
    `;
}

export function renderCards(documents) {
    const grid = document.getElementById('documents-grid');
    if (!grid) return;

    if (documents.length === 0) {
        grid.innerHTML = `<div class="md:col-span-2 xl:col-span-3 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center"><p class="text-gray-500 dark:text-gray-400">Nenhum documento encontrado.</p></div>`;
        return;
    }

    grid.innerHTML = documents.map(doc => {
        const macro = doc.subcategoria?.categoria;
        const micro = doc.subcategoria;
        const anexoCardHtml = doc.anexo_nome ? `
            <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Arquivo Anexado:</h4>
                <a href="#" data-action="download" data-id="${doc.id}" data-name="${doc.anexo_nome}" class="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    ${ICONS.download}
                    <span class="truncate">${doc.anexo_nome}</span>
                </a>
            </div>` : '';

        return `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-5 flex flex-col transition hover:shadow-lg hover:-translate-y-1">
            <div class="flex-1">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white pr-4">${doc.titulo}</h3>
                    <button data-id="${doc.id}" data-action="view" class="view-document-btn flex-shrink-0 p-2 text-brand-green hover:bg-green-100 dark:text-emerald-400 dark:hover:bg-neutral-700 rounded-full" title="Visualizar">
                        ${ICONS.eye}
                    </button>
                </div>
                ${macro ? `<div class="flex flex-wrap gap-2 mb-3"><span class="px-2 py-0.5 rounded text-xs font-medium text-white" style="background-color: ${macro.cor || '#6c757d'}">${macro.nome}</span>${micro ? `<span class="px-2 py-0.5 rounded text-xs font-medium text-white" style="background-color: ${micro.cor || '#6c757d'}">${micro.nome}</span>` : ''}</div>` : ''}
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3 mb-4">${doc.conteudo}</p>
            </div>
            <div class="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                ${(doc.PalavraChaves && doc.PalavraChaves.length > 0) ? `<div class="flex flex-wrap gap-1.5">${doc.PalavraChaves.map(p => `<span class="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-md text-xs">${p.nome}</span>`).join('')}</div>` : ''}
                ${anexoCardHtml}
                <div class="text-xs text-gray-400 dark:text-gray-500 flex justify-between pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Atualizado: ${new Date(doc.updatedAt).toLocaleDateString('pt-BR')}</span>
                    <span>Doc. N°: ${doc.id}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

export function renderPagination(totalItems) {
    const container = document.getElementById('pagination-container');
    const documentsPerPage = state.getDocumentsPerPage();
    const currentPage = state.getCurrentPage();

    if (totalItems <= documentsPerPage) {
        container.innerHTML = '';
        return;
    }
    const totalPages = Math.ceil(totalItems / documentsPerPage);
    const startIndex = (currentPage - 1) * documentsPerPage;
    const summary = `Mostrando ${startIndex + 1}-${Math.min(startIndex + documentsPerPage, totalItems)} de ${totalItems}`;

    container.innerHTML = `
        <span>${summary}</span>
        <div class="flex gap-2">
            <button data-action="prev-page" class="px-3 py-1 border rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1" ${currentPage === 1 ? 'disabled' : ''}>
                ${ICONS.arrowLeft}Anterior
            </button>
            <button data-action="next-page" class="px-3 py-1 border rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1" ${currentPage >= totalPages ? 'disabled' : ''}>
                Próxima${ICONS.arrowRight}
            </button>
        </div>
    `;
}

export function updateFilterButtonsState() {
    const { category: currentCategoryFilter } = state.getCurrentFilters();
    const allCategories = state.getCategories();
    const isDarkMode = document.documentElement.classList.contains('dark');

    document.querySelectorAll('.filter-btn').forEach(btn => {
        const catId = btn.dataset.categoryId;
        const category = allCategories[catId];
        const color = category?.cor || '#087d3c';

        if (catId === currentCategoryFilter) {
            btn.style.backgroundColor = color;
            btn.style.borderColor = color;
            btn.style.color = 'white';
        } else {
            btn.style.backgroundColor = 'transparent';
            if (isDarkMode) {
                btn.style.borderColor = '#4b5563';
                btn.style.color = '#d1d5db';
            } else {
                btn.style.borderColor = '#d1d5db';
                btn.style.color = '#374151';
            }
        }
    });
}

export function showDocumentModal(doc) {
    const anexoModalHtml = doc.anexo_nome ? `
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 class="text-base font-semibold text-gray-800 dark:text-white mb-2">Arquivo Anexado</h4>
            <a href="#" data-action="download" data-id="${doc.id}" data-name="${doc.anexo_nome}" class="inline-flex items-center gap-2 text-blue-600 hover:underline">
                <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                <span>Baixar ${doc.anexo_nome}</span>
            </a>
        </div>` : '';

    const modalContent = `
        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-gray-800 dark:text-gray-300">
                ${doc.conteudo.replace(/\n/g, '<br>')}
            </div>
            ${anexoModalHtml}
        </div>
    `;

    const viewModal = new Modal({
        id: `view-doc-${doc.id}`,
        title: doc.titulo,
        content: modalContent,
        footerButtons: [{ text: 'Fechar', type: 'primary', onClick: () => viewModal.destroy() }]
    });
    viewModal.show();
}

export function showErrorModal(title, message) {
    document.getElementById('colaborador-error-modal')?.remove();
    const errorModal = new Modal({
        id: 'colaborador-error-modal',
        title: title,
        content: `<p class="text-red-500">${message}</p>`,
        footerButtons: [{ text: 'OK', type: 'danger', onClick: () => errorModal.destroy() }]
    });
    errorModal.show();
}
// funcao para mostrar o carregamento do skeleton
function createSkeletonCard() {
    return `
        <div class="bg-white dark:bg-gray-800/50 p-4 rounded-lg animate-pulse">
            <div class="flex gap-4 items-center">
                <div class="h-16 w-16 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                <div class="flex-1 space-y-3">
                    <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded-md w-3/4"></div>
                    <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded-md w-full"></div>
                    <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded-md w-5/6"></div>
                </div>
            </div>
        </div>
    `;
}

export function showLoadingState() {
    const grid = document.getElementById('documents-grid');
    if (!grid) return;

    // Define o número de skeletons que você quer mostrar.
    const skeletonCount = 6; 
    let skeletonHTML = '';

    for (let i = 0; i < skeletonCount; i++) {
        skeletonHTML += createSkeletonCard();
    }
    
    grid.innerHTML = skeletonHTML;
}

export function showLoadingError() {
    const grid = document.getElementById('documents-grid');
    if (grid) {
        grid.innerHTML = `
            <div class="md:col-span-2 xl:col-span-3 text-center p-8 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <p class="text-red-600 dark:text-red-300 font-semibold">Falha ao carregar os documentos.</p>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Por favor, tente recarregar a página.</p>
            </div>
        `;
    }
}