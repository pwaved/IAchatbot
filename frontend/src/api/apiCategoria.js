import { API_BASE_URL, getFetchOptions, handleResponse } from './apiUtils.js';

export async function getCategories() {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/categorias`, options);
    return handleResponse(response);
}

export async function getCategoryById(id) {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/categorias/${id}`, options);
    return handleResponse(response);
}

export async function createCategory(data) {
    const options = getFetchOptions('POST', data);
    const response = await fetch(`${API_BASE_URL}/categorias`, options);
    return handleResponse(response);
}

export async function updateCategory(id, data) {
    const options = getFetchOptions('PUT', data);
    const response = await fetch(`${API_BASE_URL}/categorias/${id}`, options);
    return handleResponse(response);
}

export async function deleteCategory(id) {
    const options = getFetchOptions('DELETE');
    const response = await fetch(`${API_BASE_URL}/categorias/${id}`, options);
    return handleResponse(response);
}