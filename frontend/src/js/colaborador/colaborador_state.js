// /colaborador/colaborador_state.js

const state = {
    allDocuments: [],
    allCategories: {},
    currentCategoryFilter: '',
    currentSearchTerm: '',
    currentPage: 1,
    documentsPerPage: 10,
};

export function getDocuments() {
    return state.allDocuments;
}

export function getCategories() {
    return state.allCategories;
}

export function getCurrentPage() {
    return state.currentPage;
}

export function getDocumentsPerPage() {
    return state.documentsPerPage;
}

export function getCurrentFilters() {
    return {
        category: state.currentCategoryFilter,
        search: state.currentSearchTerm,
    };
}

export function setAllDocuments(documents) {
    state.allDocuments = documents;
}

export function setAllCategories(categories) {
    state.allCategories = categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat }), {});
}

export function setCurrentPage(page) {
    state.currentPage = page;
}

export function setCategoryFilter(categoryId) {
    state.currentCategoryFilter = categoryId;
}

export function setSearchTerm(term) {
    state.currentSearchTerm = term;
}