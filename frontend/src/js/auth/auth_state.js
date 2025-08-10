// /auth/auth_state.js

import chat from '../chat.js';
import * as api from '../../api/apiUsuarios.js'; 

let user = null; 

/**
 * Salva os dados da sessão apenas na memória do navegador.
 * @param {object} newUser - O objeto do usuário vindo da API.
 */
export function saveSession(newUser) {
    user = newUser;
    // Garante que o array de permissões exista
    if (user && !user.permissions) {
        user.permissions = [];
    }

    if (chat.isInitialized) {
        chat.setAuthState(true);
    }
}

/**
 * Limpa os dados da sessão da memória.
 */
export function clearSession() {
    user = null;


    if (chat.isInitialized) {
        chat.setAuthState(false);
    }
}

/**
 * Verifica com o backend se existe uma sessão de cookie válida.
 * @returns {Promise<boolean>} - Retorna true se a sessão for válida.
 */
export async function checkSession() {
    try {
        // rota para verificar se a rota do usuario é valida
        const sessionUser = await api.getMe(); //  /api/auth/me
        saveSession(sessionUser);
        return true;
    } catch (error) {
        // Se a API retornar 401 (Não autorizado), significa que não há sessão válida.
        clearSession();
        return false;
    }
}


/**
 * Retorna os dados do usuário logado.
 * @returns {object|null}
 */
export function getLoggedInUser() {
    return user;
}

/**
 * Verifica se o usuário está logado.
 * @returns {boolean}
 */
export function isLoggedIn() {
    return !!user; // A verificação é baseada apenas na existência do objeto do usuário.
}

/**
 * Verifica se o usuário logado possui uma permissão específica.
 * @param {string} requiredPermission - O nome da permissão a ser verificada.
 * @returns {boolean}
 */
export function hasPermission(requiredPermission) {
    if (!isLoggedIn() || !user.permissions) {
        return false;
    }
    return user.permissions.includes(requiredPermission);
}

/**
 * Verifica se o usuário tem permissão de Admin (acesso ao painel).
 * @returns {boolean}
 */
export function isAdmin() {
    return hasPermission('ACCESS_ADMIN_PANEL');
}

/**
 * Verifica se o usuário tem permissão de Colaborador (acesso à base de conhecimento).
 * @returns {boolean}
 */
export function isColaborador() {
    return hasPermission('ACCESS_KNOWLEDGE_BASE');
}