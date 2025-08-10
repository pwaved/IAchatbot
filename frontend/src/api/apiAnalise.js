import { API_BASE_URL, getFetchOptions, handleResponse } from './apiUtils.js';

/**
 * Busca os dados de análise de documentos do backend.
 * @returns {Promise<object>}
 */
export async function getAnalyticsData() {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/analise/documents`, options);
    return handleResponse(response);
}

/**
 * Busca consultas do chat com filtros e paginação.
 * @param {object} filters - Objeto com os filtros (page, searchTerm, etc.).
 * @returns {Promise<object>}
 */
export async function searchConsultations(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    const url = `${API_BASE_URL}/analise/consultations/search?${queryParams}`;
    const options = getFetchOptions('GET');
    const response = await fetch(url, options);
    return handleResponse(response);
}