import { API_BASE_URL, getFetchOptions, handleResponse } from './apiUtils.js';

// login/registro e reset de senha

export async function login(email, password) {
    const body = { email, password };
    // Usamos getFetchOptions para configurar a requisição POST com corpo e credenciais.
    const options = getFetchOptions('POST', body);
    const response = await fetch(`${API_BASE_URL}/auth/login`, options);
    return handleResponse(response);
}

export async function register(userData) { // userData é um objeto: { nome, email, password, perfil }
    const options = getFetchOptions('POST', userData);
    const response = await fetch(`${API_BASE_URL}/auth/register`, options);
    return handleResponse(response);
}

export async function logout() {
    // Para o logout, apenas precisamos enviar a requisição POST com o cookie.
    const options = getFetchOptions('POST');
    const response = await fetch(`${API_BASE_URL}/auth/logout`, options);
    // Limpamos o estado local da aplicação (ex: dados do usuário em um context) após o logout.
    // localStorage.removeItem('authToken'); // Não é mais necessário.
    return handleResponse(response);
}

export async function requestPasswordReset(email) {
    const options = getFetchOptions('POST', { email });
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, options);
    return handleResponse(response);
}

export async function resetPassword({ email, code, newPassword }) {
    const body = { email, code, newPassword };
    const options = getFetchOptions('POST', body);
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, options);
    return handleResponse(response);
}

// --- Operações de CRUD de Usuários (Admin) ---

export async function getOperators() {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/usuarios`, options);
    return handleResponse(response);
}

export async function updateUser(userId, userData) {
    const options = getFetchOptions('PUT', userData);
    const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`, options);
    return handleResponse(response);
}

export async function deleteUser(userId) {
    const options = getFetchOptions('DELETE');
    const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`, options);
    // O handleResponse já trata o caso de status 204 (No Content).
    return handleResponse(response);
}

export async function getUserById(userId) {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`, options);
    return handleResponse(response);
}

export async function createUser(userData) {
    const options = getFetchOptions('POST', userData);
    const response = await fetch(`${API_BASE_URL}/usuarios`, options);
    return handleResponse(response);
}

// --- Administração de Usuários Pendentes ---

export async function getPendingUsers() {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/admin/users/pending`, options);
    return handleResponse(response);
}

export async function approveUser(userId, perfilId) {
    const options = getFetchOptions('PATCH', { perfilId });
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/approve`, options);
    return handleResponse(response);
}

export async function rejectUser(userId) {
    const options = getFetchOptions('DELETE');
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/reject`, options);
    return handleResponse(response);
}

// --- Gerenciamento de Senha do Usuário Logado ---

export async function updateUserPassword(passwordData) {
    const options = getFetchOptions('POST', passwordData);
    const response = await fetch(`${API_BASE_URL}/usuarios/change-password`, options);
    return handleResponse(response);
}

// --- Gerenciamento de Sessões Ativas (Admin) ---

export async function getActiveSessions() {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/sessoes/ativas`, options);
    return handleResponse(response);
}

export async function revokeSession(sessionId) {
    const options = getFetchOptions('DELETE');
    const response = await fetch(`${API_BASE_URL}/sessoes/${sessionId}`, options);
    return handleResponse(response);
}
export async function getMe() {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/auth/me`, options);
    return handleResponse(response);
}