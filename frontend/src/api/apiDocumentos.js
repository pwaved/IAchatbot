// /api/apiDocumentos.js

import { API_BASE_URL, getFetchOptions, handleResponse } from './apiUtils.js';

// --- Funções da API ---

export async function getDocuments(params = {}) {
    const { page = 1, limit = 15, search = '', categoryId = '' } = params;
    const query = new URLSearchParams({ page, limit, search, categoryId }).toString();
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/documentos?${query}`, options);
    return handleResponse(response);
}

export async function getDocumentById(id) {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/documentos/${id}`, options);
    return handleResponse(response);
}

export async function createDocument(formData) {
    // O terceiro argumento `true` indica que o corpo é FormData.
    const options = getFetchOptions('POST', formData, true);
    const response = await fetch(`${API_BASE_URL}/documentos`, options);
    return handleResponse(response);
}

export async function updateDocument(id, formData) {
    const options = getFetchOptions('PUT', formData, true);
    const response = await fetch(`${API_BASE_URL}/documentos/${id}`, options);
    return handleResponse(response);
}

export async function deleteDocument(id) {
    const options = getFetchOptions('DELETE');
    const response = await fetch(`${API_BASE_URL}/documentos/${id}`, options);
    return handleResponse(response);
}

export async function downloadDocumentAttachment(documentId) {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/documentos/${documentId}/download`, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Falha no download com status: ${response.status}`;
        throw new Error(errorMessage);
    }
    return response.blob();
}

export async function removeAttachment(documentId) {
    const options = getFetchOptions('DELETE');
    const response = await fetch(`${API_BASE_URL}/documentos/${documentId}/anexo`, options);
    return handleResponse(response);
}

export async function getAssuntosPendentes() {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/assuntos-pendentes`, options);
    return handleResponse(response);
}

export async function updateAssuntoPendenteStatus(id, status) {
    const options = getFetchOptions('PATCH', { status });
    const response = await fetch(`${API_BASE_URL}/assuntos-pendentes/${id}/status`, options);
    return handleResponse(response);
}

export async function getAssuntoPendenteById(id) {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/assuntos-pendentes/${id}`, options);
    return handleResponse(response);
}

export async function getCategories() {
    const { getCategories: getCategoriesFromApi } = await import('./apiCategoria.js');
    return getCategoriesFromApi();
}
