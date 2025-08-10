import Modal from '../../componentes/modal.js';
import { ICONS } from '../../utils/icons.js';
import { setState } from './categoria_state.js';

/**
 * Retorna o HTML para uma linha de input de subcategoria.
 * @param {object} sub - Dados da subcategoria (opcional).
 * @returns {string} String HTML do input.
 */
export function renderSubcategoryInput(sub = {}) {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    return `
        <div class="subcategory-item flex items-center space-x-2" data-sub-id="${sub.id || ''}">
            <input type="text" value="${sub.nome || ''}" class="subcategory-name w-full bg-neutral-200 dark:bg-neutral-600 border border-neutral-300 dark:text-neutral-300 dark:border-neutral-500 rounded-lg px-4 py-2" placeholder="Nome da Subcategoria" required>
            <input type="color" value="${sub.cor || randomColor}" class="subcategory-color w-16 h-10 p-1 border border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer">
            <button type="button" class="remove-subcategory-btn text-red-500 hover:text-red-700 p-2 rounded-full" title="Remover Subcategoria">${ICONS.trash}</button>
        </div>`;
}

/**
 * Renderiza a grade de cards de categoria.
 * @param {Array} categories - A lista de categorias a ser renderizada.
 */
export function renderCategoriesGrid(categories) {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;

    if (!categories || categories.length === 0) {
        grid.innerHTML = `
            <div class="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-8 text-center">
                <p class="text-neutral-500 dark:text-neutral-400">Nenhuma categoria encontrada.</p>
            </div>`;
        return;
    }

    grid.innerHTML = categories.map(cat => {
        const subcategories = Array.isArray(cat.subcategorias) ? cat.subcategorias : [];
        const subcategoriesHtml = subcategories.length === 0
            ? `<span class="text-xs text-neutral-400 dark:text-neutral-500 italic">Nenhuma subcategoria.</span>`
            : subcategories.map(sub => `
                <div class="flex items-center space-x-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg px-3 py-2 max-w-full">
                    <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${sub.cor || '#cccccc'}"></div>
                    <span class="text-sm text-neutral-800 dark:text-neutral-200 truncate max-w-[120px]" title="${sub.nome}">${sub.nome}</span>
                </div>`
            ).join('');

        return `
            <div class="category-card w-full lg:w-[calc(50%-0.75rem)] bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 flex flex-col min-h-[220px]" data-category-name="${cat.nome}">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-4 h-4 rounded-full flex-shrink-0" style="background-color: ${cat.cor || '#cccccc'}"></div>
                        <h4 class="text-lg font-semibold text-neutral-800 dark:text-white">${cat.nome}</h4>
                        <span class="bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 px-2 py-1 rounded text-sm">${subcategories.length} subcategorias</span>
                    </div>
                    <div class="flex space-x-2 self-end sm:self-auto flex-shrink-0">
                        <button data-action="edit" data-id="${cat.id}" class="p-2 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-neutral-700 rounded-full" title="Editar">${ICONS.pencil}</button>
                        <button data-action="delete" data-id="${cat.id}" class="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-neutral-700 rounded-full" title="Remover">${ICONS.trash}</button>
                    </div>
                </div>
                <div class="space-y-3">
                    <h5 class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Subcategorias:</h5>
                    <div class="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-1">${subcategoriesHtml}</div>
                </div>
            </div>`;
    }).join('');
}

/**
 * Renderiza o layout principal da página de categorias.
 */
export function renderPageLayout() {
    const content = document.getElementById('categories-content');
    if (!content) return;

    content.innerHTML = `
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-8">
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <span class="text-brand-green">${ICONS.categories}</span>
                    <h3 class="text-2xl font-bold text-neutral-800 dark:text-white">Gerenciar Categorias</h3>
                </div>
                <p class="text-neutral-600 dark:text-neutral-400 max-w-2xl">
                    Crie, edite e organize as categorias e subcategorias que serão usadas para classificar os documentos na Base de Conhecimento.
                </p>
            </div>
            <button data-action="add" class="bg-brand-green hover:bg-brand-darkgreen text-white font-semibold rounded-lg px-4 py-2 transition w-full sm:w-auto flex items-center justify-center gap-2 flex-shrink-0">
                <span>${ICONS.plus}</span>
                Adicionar Categoria
            </button>
        </div>
        <div id="categories-grid" class="flex flex-wrap gap-6"></div>
    `;
}

/**
 * Cria e exibe o modal do formulário de categoria.
 * @param {object} options - Opções para o modal.
 * @param {boolean} options.isEditing - Se o modal é para edição.
 * @param {object} options.categoryData - Dados da categoria para preencher o formulário.
 * @param {Function} options.onSubmit - Callback a ser executado no submit do formulário.
 */
export function showCategoryFormModal({ isEditing, categoryData, onSubmit }) {
    const modalTitle = isEditing ? 'Editar Categoria' : 'Adicionar Nova Categoria';
    const subcategoriesHTML = (categoryData.subcategorias || []).map(renderSubcategoryInput).join('');
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

    const formContentHTML = `
        <div class="max-h-[70vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-500">
            <form id="category-form" class="space-y-4" novalidate>
                <input type="hidden" name="id" value="${categoryData.id || ''}">
                <div>
                    <label for="category-name" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Nome da Categoria</label>
                    <input id="category-name" name="nome" type="text" value="${categoryData.nome || ''}" placeholder="Ex: Financeiro" class="w-full bg-neutral-100 dark:bg-neutral-700 border dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-3" required>
                </div>
                <div>
                    <label for="category-color" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Cor da Categoria</label>
                    <input id="category-color" name="cor" type="color" value="${categoryData.cor || randomColor}" class="w-full h-10 p-1 border border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer">
                </div>
                <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Subcategorias</label>
                    <div id="subcategories-list" class="space-y-2">${subcategoriesHTML}</div>
                    <button type="button" id="add-subcategory-btn" class="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">+ Adicionar Subcategoria</button>
                </div>
                <p id="category-error-message" class="text-sm text-red-500"></p>
            </form>
        </div>`;

    const formModal = new Modal({
        id: 'category-form-modal',
        title: modalTitle,
        content: formContentHTML,
        footerButtons: [
            { text: 'Cancelar', type: 'secondary', onClick: () => formModal.destroy() },
            { text: 'Salvar', type: 'primary', onClick: () => {
                const form = formModal.modalElement.querySelector('#category-form');
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }}
        ]
    });
    
    formModal.show();
    setState({ activeModal: formModal });

    // Adiciona listeners internos do modal
    const form = formModal.modalElement.querySelector('#category-form');
    const subcategoriesList = form.querySelector('#subcategories-list');

    subcategoriesList.addEventListener('click', (event) => {
        if (event.target.closest('.remove-subcategory-btn')) {
            event.target.closest('.subcategory-item').remove();
        }
    });

    form.querySelector('#add-subcategory-btn').addEventListener('click', () => {
        subcategoriesList.insertAdjacentHTML('beforeend', renderSubcategoryInput());
    });
    
    form.addEventListener('submit', onSubmit);
}
