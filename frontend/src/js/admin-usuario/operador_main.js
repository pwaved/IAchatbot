import { handleApiError } from '../../utils/error-handle.js';
import { checkAdminAuth } from '../auth/auth_main.js';
import * as userApi from '../../api/apiUsuarios.js';
import { setState , getState} from './operador_state.js';
import * as UI from './operador_ui.js';
import { setupEventListeners } from './operador_eventos.js';

/**
 * Atualiza a UI com base no estado atual (tabela de operadores e paginação).
 * Esta é a função central que redesenha a visão de dados.
 */
export function updateView() {
    const { operators, currentPage, operatorsPerPage } = getState();

    // Calcula o "slice" (fatia) de operadores para a página atual
    const startIndex = (currentPage - 1) * operatorsPerPage;
    const endIndex = startIndex + operatorsPerPage;
    const operatorsToRender = operators.slice(startIndex, endIndex);

    // Renderiza a tabela com apenas os operadores desta página
    UI.renderOperatorsTable(operatorsToRender);

    //  Renderiza os controles de paginação
    UI.renderPagination(operators.length, currentPage, operatorsPerPage, 'operators-pagination-container', 'operator');
}

export function updateSessionsView() {
    const { activeSessions, sessionsCurrentPage, sessionsPerPage } = getState();

    const startIndex = (sessionsCurrentPage - 1) * sessionsPerPage;
    const endIndex = startIndex + sessionsPerPage;
    const sessionsToRender = activeSessions.slice(startIndex, endIndex);

    UI.renderActiveSessionsTable(sessionsToRender);

    UI.renderPagination(
        activeSessions.length, 
        sessionsCurrentPage, 
        sessionsPerPage, 
        'sessions-pagination-container', 
        'session'
    );
}

/**
 * Busca a lista de todos os operadores, salva no estado e chama a renderização.
 */
export async function loadAndRenderOperators() {
    const content = document.getElementById('operators-content');
    try {
        const operators = await userApi.getOperators();
        // Salva a lista completa e reseta para a primeira página
        setState({ operators, currentPage: 1 }); 
        
        updateView(); // Chama a função central de renderização
        await updatePendingBadge();

    } catch (error) {
        handleApiError(error, content);
    }
}

/**
 * Busca e renderiza a lista de sessões ativas.
 */
export async function loadAndRenderSessions() {
    const sessionsContainer = document.getElementById('active-sessions-content');
    if (!sessionsContainer) return;
    sessionsContainer.innerHTML = `<p class="text-neutral-500 dark:text-neutral-400">Buscando sessões ativas...</p>`;
    try {
        const sessions = await userApi.getActiveSessions();
        // salva o estado
        setState({ activeSessions: sessions, sessionsCurrentPage: 1 });
        // chama a nova view
        updateSessionsView();
    } catch (error) {
        handleApiError(error, sessionsContainer);
    }
}

/**
 * Atualiza o contador de usuários pendentes no botão.
 */
export async function updatePendingBadge() {
    try {
        const pendingUsers = await userApi.getPendingUsers();
        setState({ pendingUsers });
        UI.updatePendingButtonBadge(pendingUsers.length);
    } catch (error) {
        console.error("Não foi possível atualizar o contador de aprovações.", error);
        UI.updatePendingButtonBadge(0);
    }
}

/**
/**
 * Função de inicialização principal para a aba de operadores.
 */
async function init() {
    const content = document.getElementById('operators-content');
    if (!content) return;

    try {
        checkAdminAuth();
        
        UI.renderPageLayout();
        // Passa a função updateView para os event listeners poderem usá-la
        setupEventListeners(updateView, updateSessionsView); 
        
        // Ativa a primeira aba por padrão
        const initialTab = document.querySelector('[data-tab="manage-users"]');
        if (initialTab) {
            initialTab.click();
        }
        
        await loadAndRenderOperators();

    } catch (error) {
        if (error.message === 'AUTH_REDIRECTING') {
            return;
        }
        console.error("Falha na inicialização da aba de usuários:", error);
        handleApiError(error, content);
    }
}
export default { init };
