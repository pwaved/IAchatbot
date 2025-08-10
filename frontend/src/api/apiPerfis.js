import { API_BASE_URL, getFetchOptions, handleResponse } from './apiUtils.js';


/**
 * Busca todos os perfis (requer autenticação de admin).
 */
export async function getProfiles() {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/perfis`, options);
    return handleResponse(response);
}

/**
 * Busca todos os perfis de forma pública (não requer autenticação).
 */
export async function getPublicProfiles() {
    // Esta rota é pública, mas usar getFetchOptions é seguro e consistente.
    // O backend simplesmente não exigirá uma sessão válida para esta rota específica.
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/perfis/public`, options);
    return handleResponse(response);
}

/**
 * Busca um único perfil pelo ID (requer autenticação de admin).
 */
export async function getProfileById(id) {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/perfis/${id}`, options);
    return handleResponse(response);
}

/**
 * Cria um novo perfil (requer autenticação de admin).
 */
export async function createProfile(profileData) {
    const options = getFetchOptions('POST', profileData);
    const response = await fetch(`${API_BASE_URL}/perfis`, options);
    return handleResponse(response);
}

/**
 * Atualiza um perfil existente (requer autenticação de admin).
 */
export async function updateProfile(id, profileData) {
    const options = getFetchOptions('PUT', profileData);
    const response = await fetch(`${API_BASE_URL}/perfis/${id}`, options);
    return handleResponse(response);
}

/**
 * Deleta um perfil (requer autenticação de admin).
 */
export async function deleteProfile(id) {
    const options = getFetchOptions('DELETE');
    const response = await fetch(`${API_BASE_URL}/perfis/${id}`, options);
    return handleResponse(response);
}

/**
 * Busca a lista de todas as permissões disponíveis.
 */
export async function getPermissions() {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/permissoes`, options);
    return handleResponse(response);
}