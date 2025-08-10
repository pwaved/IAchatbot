import { handleApiError } from '../../utils/error-handle.js';
import { checkAdminAuth } from '../auth/auth_main.js';
import { getCategories } from '../../api/apiCategoria.js';
import { setState } from './categoria_state.js';
import * as UI from './categoria_ui.js';
import { setupEventListeners } from './categoria_eventos.js';

/**
 * Busca todas as categorias e as renderiza na grade.
 */
export async function loadAndRenderCategories() {
    const content = document.getElementById('categories-content');
    try {
        const categories = await getCategories();
        setState({ categories });
        UI.renderCategoriesGrid(categories);
    } catch (error) {
        handleApiError(error, content);
    }
}

/**
 * Função de inicialização principal para a aba de categorias.
 */
async function init() {
    const content = document.getElementById('categories-content');
    if (!content) return;

    try {
        checkAdminAuth();
        
        UI.renderPageLayout();
        setupEventListeners();
        
        await loadAndRenderCategories();

    } catch (error) {
        if (error.message === 'AUTH_REDIRECTING') {
            return;
        }
        console.error("Falha na inicialização da aba de categorias:", error);
        handleApiError(error, content);
    }
}

export default { init };
