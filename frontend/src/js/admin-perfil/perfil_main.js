import { handleApiError } from '../../utils/error-handle.js';
import { checkAdminAuth } from '../auth/auth_main.js';
import * as profileApi from '../../api/apiPerfis.js';
import { setState } from './perfil_state.js';
import * as UI from './perfil_ui.js';
import { setupEventListeners } from './perfil_eventos.js';

/**
 * Busca todos os perfis e os renderiza na tabela.
 */
export async function loadAndRenderProfiles() {
    const content = document.getElementById('profiles-content');
    try {
        const profiles = await profileApi.getProfiles();
        setState({ profiles });
        UI.renderProfilesTable(profiles);
    } catch (error) {
        handleApiError(error, content);
    }
}

/**
 * Busca todas as permissões disponíveis e as armazena no estado.
 * @returns {Promise<Array>} A lista de permissões.
 */
export async function loadAllPermissions() {
    try {
        const permissions = await profileApi.getPermissions();
        setState({ allPermissions: permissions });
        return permissions;
    } catch (error) {
        handleApiError(error);
        return []; // Retorna array vazio em caso de erro
    }
}

/**
 * Função de inicialização principal para a aba de perfis.
 */
async function init() {
    const content = document.getElementById('profiles-content');
    if (!content) return;

    try {
        checkAdminAuth();
        
        UI.renderPageLayout();
        setupEventListeners();
        
        // Carrega os dados iniciais
        await loadAndRenderProfiles();

    } catch (error) {
        if (error.message === 'AUTH_REDIRECTING') {
            return;
        }
        console.error("Falha na inicialização da aba de perfis:", error);
        handleApiError(error, content);
    }
}

export default { init };
