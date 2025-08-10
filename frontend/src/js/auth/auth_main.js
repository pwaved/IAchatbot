// /auth/auth_main.js
import * as api from '../../api/apiUsuarios.js';
import { getPublicProfiles } from '../../api/apiPerfis.js';
import * as authState from './auth_state.js';
import * as authUI from './auth_ui.js';
import * as authEventos from './auth_eventos.js';
import chat from '../chat.js';


export async function handleLogin(email, password) {
    const data = await api.login(email, password);
    authState.saveSession(data.usuario);
    authUI.updateHeaderUI();
    authUI.closeLoginModal();
    chat.setAuthState(true);
}

export async function handleLogout() {
    try {
        await api.logout();
    } catch (error) {
        console.error('Erro no servidor durante o logout, mas a sessão local será limpa.', error);
    } finally {
        authState.clearSession();
        chat.setAuthState(false);
        document.getElementById('logout-confirm-modal')?.remove();
        window.location.href = '/';
    }
}

export async function handleChangePassword(payload) {
    return await api.updateUserPassword(payload);
}
export async function handleRegistration(payload) {
    return await api.register(payload);
}
export async function handleRequestPasswordReset(email) {
    return await api.requestPasswordReset(email);
}
export async function handleResetPassword(payload) {
    return await api.resetPassword(payload);
}
export async function fetchProfilesForRegistration() {
    return await getPublicProfiles();
}

/**
 * Inicializa o módulo de autenticação.
 * Verifica a sessão e retorna o status de login para o orquestrador (main.js).
 */
async function init() {
    //  Verifica a sessão no backend e carrega o estado local
    await authState.checkSession();
    
    // Configura a UI e os eventos de acordo com o estado carregado
    authEventos.initializeEventListeners();
    authUI.updateHeaderUI();
    
    // O `main.js` usará esse retorno para atualizar o chat.
    return authState.isLoggedIn();
}

/**
 * Verifica se o usuário é um administrador.
 */
async function checkAdminAuth() {
    if (!authState.isAdmin()) {
        window.location.href = '/';
        // Lança um erro para parar a execução dos scripts da página de admin
        throw new Error('AUTH_REDIRECTING'); 
    }
}

export {
    init,
    checkAdminAuth
};

export { getLoggedInUser } from './auth_state.js';