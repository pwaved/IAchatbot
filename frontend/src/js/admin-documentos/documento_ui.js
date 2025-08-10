import { ICONS } from '../../utils/icons';

/**
 * Cria o HTML para um único card de documento.
 * @param {object} doc - O objeto do documento.
 * @returns {string} O HTML do card.
 */
function createDocumentCardHTML(doc) {
    const macro = doc.subcategoria?.categoria;
    const micro = doc.subcategoria;
    const keywordsHTML = (doc.PalavraChaves || [])
        .map(p => `<span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">${p.nome}</span>`)
        .join('');

    const attachmentHTML = doc.anexo_nome ? `
        <a href="#" data-action="download" data-id="${doc.id}" data-name="${doc.anexo_nome}" class="flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <svg class="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
            <span class="truncate">${doc.anexo_nome}</span>
        </a>` : '';

    return `
      <div class="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 flex flex-col transition hover:shadow-md">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-2">
              <div class="flex-1">
                  <h4 class="font-semibold text-neutral-800 dark:text-white text-lg mb-1">${doc.titulo}</h4>
                  ${macro ? `<div class="flex flex-wrap gap-2 mb-2"><span class="px-2 py-1 rounded text-xs text-white" style="background-color: ${macro.cor}">${macro.nome}</span>${micro ? `<span class="px-2 py-1 rounded text-xs text-white" style="background-color: ${micro.cor}">${micro.nome}</span>` : ''}</div>` : ''}
              </div>
              <div class="flex space-x-2 self-end sm:self-auto flex-shrink-0">
                  <button data-action="view" data-id="${doc.id}" class="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-neutral-700 rounded-full" title="Visualizar" aria-label="Visualizar Documento">${ICONS.eye}</button>
                  <button data-action="edit" data-id="${doc.id}" class="p-2 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-neutral-700 rounded-full" title="Editar" aria-label="Editar Documento">${ICONS.pencil}</button>
                  <button data-action="delete" data-id="${doc.id}" data-doc-title="${doc.titulo}" class="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-neutral-700 rounded-full" title="Remover" aria-label="Remover Documento">${ICONS.trash}</button>
              </div>
          </div>
          <p class="text-neutral-600 dark:text-neutral-400 mb-3 text-sm leading-relaxed line-clamp-3">${doc.conteudo}</p>
          <div class="flex-grow"></div>
          <div class="mt-auto space-y-3">
              <div class="flex flex-wrap gap-1">${keywordsHTML}</div>
              ${attachmentHTML}
              <div class="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-neutral-500 dark:text-neutral-500 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <span>Adicionado em: ${new Date(doc.dataInclusao).toLocaleDateString('pt-BR')}</span>
                  <span>Doc. N°: ${doc.id}</span>
              </div>
          </div>
      </div>`;
}

/**
 * Renderiza a grade de documentos no container apropriado.
 * @param {Array} documentsToRender - A lista de documentos para exibir.
 */
export function renderDocumentsGrid(documentsToRender) {
    const gridContainer = document.getElementById('documents-grid');
    if (!gridContainer) return;

    if (documentsToRender.length === 0) {
        gridContainer.innerHTML = `<div class="md:col-span-2 xl:col-span-3 bg-neutral-50 dark:bg-neutral-800/50 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-8 text-center"><p class="text-neutral-500 dark:text-neutral-400">Nenhum documento encontrado.</p></div>`;
    } else {
        gridContainer.innerHTML = documentsToRender.map(createDocumentCardHTML).join('');
    }
}

/**
 * Renderiza os controles de paginação.
 * @param {number} totalItems - O número total de itens filtrados.
 * @param {number} currentPage - A página atual.
 * @param {number} documentsPerPage - Itens por página.
 */
export function renderPagination(totalItems, currentPage, documentsPerPage) {
    const container = document.getElementById('admin-pagination-container');
    if (!container) return;

    if (totalItems <= documentsPerPage) {
        container.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(totalItems / documentsPerPage);
    const startIndex = (currentPage - 1) * documentsPerPage;
    const summary = `Mostrando ${startIndex + 1}-${Math.min(startIndex + documentsPerPage, totalItems)} de ${totalItems}`;

    container.innerHTML = `
        <span class="text-sm text-gray-600 dark:text-gray-400">${summary}</span>
        <div class="flex gap-2">
            <button data-action="prev-page" class="dark:text-white px-3 py-1 border rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1" ${currentPage === 1 ? 'disabled' : ''}>
                ${ICONS.arrowLeft}Anterior
            </button>
            <button data-action="next-page" class="dark:text-white px-3 py-1 border rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1" ${currentPage >= totalPages ? 'disabled' : ''}>
                Próxima${ICONS.arrowRight}
            </button>
        </div>
    `;
}

/**
 * Atualiza o estado visual (ativo/inativo) dos botões de filtro de categoria.
 * @param {object} allCategories - O objeto com todas as categorias.
 * @param {string} currentCategoryFilter - O ID do filtro de categoria atual.
 */
export function updateFilterButtonsState(allCategories, currentCategoryFilter) {
    const filterButtons = document.querySelectorAll('#category-filters .filter-btn');
    filterButtons.forEach(button => {
        const categoryId = button.dataset.categoryId;
        const isActive = categoryId === currentCategoryFilter;
        
        button.classList.toggle('active', isActive);
        
        const category = allCategories[categoryId];
        if (isActive) {
            const activeColor = category?.cor || '#0D6EFD'; // Azul padrão para "Todas"
            button.style.backgroundColor = activeColor;
            button.style.borderColor = activeColor;
            button.style.color = 'white';
        } else {
            const inactiveColor = category?.cor;
            if (inactiveColor) {
                button.style.backgroundColor = `${inactiveColor}20`; // Cor com transparência
                button.style.borderColor = inactiveColor;
                button.style.color = inactiveColor;
            } else { // Botão "Todas" inativo
                button.style.backgroundColor = 'transparent';
                button.style.borderColor = '#6c757d';
                button.style.color = 'inherit';
            }
        }
    });
}

/**
 * Renderiza o layout principal da página de documentos, incluindo cabeçalho, filtros e containers.
 * @param {object} allCategories - O objeto com todas as categorias para criar os filtros.
 * @param {string} currentSearchTerm - O termo de busca atual para preencher o input.
 */
export function renderPageLayout(allCategories, currentSearchTerm) {
    const documentsContent = document.getElementById('documents-content');
    if (!documentsContent) return;

    const categoryFiltersHTML = Object.values(allCategories)
        .map(macro => `<button data-action="filter-category" data-category-id="${macro.id}" class="filter-btn px-3 py-1 rounded-full text-sm border transition">${macro.nome}</button>`)
        .join('');

    documentsContent.innerHTML = `
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-8">
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <span class="text-brand-green">${ICONS.documents}</span>
                    <h3 class="text-2xl font-bold text-neutral-800 dark:text-white">Base de Conhecimento</h3>
                </div>
                <p class="text-neutral-600 dark:text-neutral-400 max-w-2xl">
                    Adicione, edite e consulte todos os documentos e procedimentos. Utilize os filtros e a busca para encontrar informações rapidamente.
                </p>
            </div>
            <div class="flex flex-col lg:flex-row gap-2 w-full lg:w-auto flex-shrink-0">
                <button data-action="show-pending" class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg px-4 py-2 transition w-full sm:w-auto flex items-center justify-center gap-2">
                    <span>${ICONS.bell}</span> Assuntos Pendentes
                </button>
                <button data-action="add" class="bg-brand-green hover:bg-brand-darkgreen text-white font-semibold rounded-lg px-4 py-2 transition w-full sm:w-auto flex items-center justify-center gap-2">
                    <span>${ICONS.plus}</span> Adicionar Documento
                </button>
            </div>
        </div>

        <div class="mb-6">
            <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Filtrar por Categoria:</h4>
            <div id="category-filters" class="flex flex-wrap gap-2">
                <button data-action="filter-category" data-category-id="" class="dark:text-white filter-btn px-3 py-1 rounded-full text-sm border transition">Todas</button>
                ${categoryFiltersHTML}
            </div>
        </div>

        <div class="relative mb-4">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500 dark:text-neutral-400">${ICONS.search}</span>
            <input type="text" id="search-docs" placeholder="Buscar por título, conteúdo ou palavras-chave..." class="w-full pl-10 pr-4 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg py-2" value="${currentSearchTerm}">
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="documents-grid">
            <!-- Cards de documentos serão inseridos aqui -->
        </div>
        
        <div id="admin-pagination-container" class="mt-8 py-4 flex justify-between items-center">
            <!-- Paginação será inserida aqui -->
        </div>
    `;
}
