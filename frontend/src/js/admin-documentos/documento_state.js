// js/admin-documentos/documentos.state.js

// Estado inicial do módulo
const state = {
    allDocuments: [],
    allCategories: {},
    currentCategoryFilter: '',
    currentSearchTerm: '',
    currentPage: 1,
    documentsPerPage: 9,
    activeModalInstance: null
};

/**
 * Retorna uma cópia do estado atual para evitar mutações diretas.
 */
export function getState() {
    return { ...state };
}

/**
 * Atualiza o estado do módulo de forma centralizada.
 * @param {object} newState - Um objeto com as chaves do estado a serem atualizadas.
 */
export function setState(newState) {
    Object.assign(state, newState);
}