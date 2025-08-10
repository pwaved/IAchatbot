import { hasPermission } from '../auth/auth_state.js';
import Modal from '../../componentes/modal.js';
import { showPermissionDeniedModal, showSuccessModal, handleApiError } from '../../utils/error-handle.js';
import * as categoryApi from '../../api/apiCategoria.js';
import { showCategoryFormModal } from './categoria_ui.js';
import { loadAndRenderCategories } from './categoria_main.js';

const requiredPermission = 'MANAGE_CATEGORIES';

/**
 * Manipula a submissão do formulário de categoria (criação/edição).
 * @param {Event} event - O evento de submit.
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const errorMessageEl = form.querySelector('#category-error-message');
    errorMessageEl.textContent = '';
    
    const id = form.querySelector('input[name="id"]').value;
    const isEditing = !!id;
    const nome = form.querySelector('#category-name').value.trim();

    if (!nome) {
        errorMessageEl.textContent = 'O nome da categoria é obrigatório.';
        return;
    }

    const subcategorias = Array.from(form.querySelectorAll('.subcategory-item')).map(item => ({
        id: item.dataset.subId || null,
        nome: item.querySelector('.subcategory-name').value.trim(),
        cor: item.querySelector('.subcategory-color').value,
    })).filter(sub => sub.nome);

    const payload = {
        nome,
        cor: form.querySelector('#category-color').value,
        subcategorias
    };

    try {
        if (isEditing) {
            await categoryApi.updateCategory(id, payload);
        } else {
            await categoryApi.createCategory(payload);
        }
        
        const modalInstance = new Modal({ id: 'category-form-modal' });
        modalInstance.destroy();
        
        showSuccessModal(`Categoria ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
        await loadAndRenderCategories();
    } catch (error) {
        errorMessageEl.textContent = error.data?.error || error.message || 'Erro desconhecido ao salvar.';
    }
}

/**
 * Abre o modal do formulário para adicionar ou editar uma categoria.
 * @param {string|null} categoryId - O ID da categoria para editar.
 */
async function openFormModal(categoryId = null) {
    if (!hasPermission(requiredPermission)) {
        return showPermissionDeniedModal();
    }
    try {
        const categoryData = categoryId ? await categoryApi.getCategoryById(categoryId) : {};
        showCategoryFormModal({
            isEditing: !!categoryId,
            categoryData,
            onSubmit: handleFormSubmit
        });
    } catch (error) {
        handleApiError(error);
    }
}

/**
 * Abre o modal de confirmação para deletar uma categoria.
 * @param {string} categoryId - O ID da categoria.
 * @param {string} categoryName - O nome da categoria.
 */
function openDeleteModal(categoryId, categoryName) {
    if (!hasPermission(requiredPermission)) {
        return showPermissionDeniedModal();
    }
    const deleteModal = new Modal({
        id: 'delete-category-modal',
        title: 'Confirmar Exclusão',
        content: `<p class="dark:text-neutral-300">Você tem certeza que deseja remover a categoria "<strong>${categoryName}</strong>"? Todas as subcategorias associadas também serão removidas.</p>`,
        footerButtons: [
            { text: 'Cancelar', type: 'secondary', onClick: () => deleteModal.destroy() },
            {
                text: 'Sim, Remover',
                type: 'danger',
                onClick: async () => {
                    try {
                        await categoryApi.deleteCategory(categoryId);
                        showSuccessModal('Categoria removida com sucesso!');
                        await loadAndRenderCategories();
                    } catch (error) {
                        handleApiError(error);
                    } finally {
                        deleteModal.destroy();
                    }
                }
            }
        ]
    });
    deleteModal.show();
}

/**
 * Manipulador de cliques central para a aba de categorias.
 * @param {Event} event - O objeto do evento de clique.
 */
function handleClick(event) {
    const target = event.target;
    const action = target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    const id = target.closest('[data-id]')?.dataset.id;

    switch (action) {
        case 'add':
            openFormModal();
            break;
        case 'edit':
            openFormModal(id);
            break;
        case 'delete': {
            const card = target.closest('.category-card');
            const categoryName = card?.dataset.categoryName || 'esta categoria';
            openDeleteModal(id, categoryName);
            break;
        }
    }
}

/**
 * Configura o event listener principal para a aba de categorias.
 */
export function setupEventListeners() {
    const content = document.getElementById('categories-content');
    if (!content || content.dataset.listenerAttached) return;

    content.addEventListener('click', handleClick);
    content.dataset.listenerAttached = 'true';
}