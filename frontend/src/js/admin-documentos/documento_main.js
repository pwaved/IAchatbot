import { getCategories } from '../../api/apiCategoria.js';
import { handleApiError } from '../../utils/error-handle.js';
import { checkAdminAuth } from '../auth/auth_main.js';
import { getState, setState } from './documento_state.js';
import * as UI from './documento_ui.js';
import { setupEventListeners } from './documento_eventos.js';
import { getDocuments } from '../../api/apiDocumentos.js';
/**
 * Carrega as categorias da API e as armazena no estado.
 */
async function loadCategories() {
    try {
        const categoriesResponse = await getCategories();
        const formattedCategories = categoriesResponse.reduce((acc, cat) => {
            acc[cat.id] = {
                id: cat.id,
                nome: cat.nome,
                cor: cat.cor,
                subcategorias: (cat.subcategorias || []).reduce((subAcc, sub) => {
                    subAcc[sub.id] = { id: sub.id, nome: sub.nome, cor: sub.cor };
                    return subAcc;
                }, {})
            };
            return acc;
        }, {});
        setState({ allCategories: formattedCategories });
    } catch (error) {
        handleApiError(error);
    }
}

/**
 * Aplica filtros e busca ao estado atual dos documentos e dispara a renderização.
 */
export function filterAndRenderDocuments() {
    const { allDocuments, currentCategoryFilter, currentSearchTerm, currentPage, documentsPerPage, allCategories } = getState();

    const searchTermLower = currentSearchTerm.toLowerCase();

    const filteredDocs = allDocuments.filter(doc => {
        const matchesSearchTerm =
            doc.titulo.toLowerCase().includes(searchTermLower) ||
            doc.conteudo.toLowerCase().includes(searchTermLower) ||
            (doc.PalavraChaves || []).some(keywordObj => keywordObj.nome.toLowerCase().includes(searchTermLower));

        const matchesCategory =
            !currentCategoryFilter ||
            (doc.subcategoria?.categoria?.id)?.toString() === currentCategoryFilter;

        return matchesSearchTerm && matchesCategory;
    });

    const startIndex = (currentPage - 1) * documentsPerPage;
    const paginatedDocs = filteredDocs.slice(startIndex, startIndex + documentsPerPage);

    // Dispara as funções de renderização da UI
    UI.renderDocumentsGrid(paginatedDocs);
    UI.renderPagination(filteredDocs.length, currentPage, documentsPerPage);
    UI.updateFilterButtonsState(allCategories, currentCategoryFilter);
}

/**
 * Busca os documentos da API, armazena no estado e inicia a primeira renderização.
 */
export async function loadAndRenderDocuments() {
    const documentsContent = document.getElementById('documents-content');
    try {
        const documents = await getDocuments();
        setState({ allDocuments: documents, currentPage: 1 });
        filterAndRenderDocuments();
    } catch (error) {
        handleApiError(error, documentsContent);
    }
}

/**
 * Função de inicialização principal para a aba de documentos.
 */
async function init() {
    const documentsContent = document.getElementById('documents-content');
    if (!documentsContent) return;

    try {
        checkAdminAuth();
        await loadCategories();

        const { allCategories, currentSearchTerm } = getState();
        
        // Renderiza o layout estático da página uma vez
        UI.renderPageLayout(allCategories, currentSearchTerm);
        
        // Configura os listeners de eventos
        setupEventListeners();
        
        // Carrega os dados dinâmicos e renderiza os cards
        await loadAndRenderDocuments();

    } catch (error) {
        if (error.message === 'AUTH_REDIRECTING') {
            console.log("Redirecionamento de autenticação em progresso.");
            return;
        }
        console.error("Falha na inicialização da aba de documentos:", error);
        handleApiError(error, documentsContent);
    }
}

// Exporta apenas o inicializador
export default {
    init
};
