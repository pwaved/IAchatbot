import { getAnalyticsData, searchConsultations } from '../../api/apiAnalise.js';
import { handleApiError } from '../../utils/error-handle.js';
import { checkAdminAuth } from '../auth/auth_main.js';
import { getState, setState } from './analise_state.js';
import * as UI from './analise_ui.js';
import { setupEventListeners } from './analise_eventos.js';
/**
 * Busca e renderiza os dados para o modal de consultas.
 */
export async function fetchAndRenderModalData() {
    const listContainer = document.getElementById('modal-consultations-list');
    const { modal } = getState();
    try {
        listContainer.innerHTML = '<p class="text-center dark:text-neutral-300 py-4">Carregando...</p>';
        const data = await searchConsultations({ page: modal.currentPage, ...modal.filters });
        UI.renderConsultationList(listContainer, data.consultations);
        UI.renderPagination(data);
    } catch (error) {
        handleApiError(error, listContainer);
    }
}

/**
 * Busca e renderiza todos os dados do dashboard principal.
 */
async function loadAndRenderDashboard() {
    const container = document.getElementById('analytics-content');
    try {
        const data = await getAnalyticsData();
        if (data) {
            UI.renderAllCharts(data);
            UI.renderConsultationList(document.getElementById('latest-consultations-list'), data.latestConsultations);
            UI.renderDocumentsForReview(data.documentsForReview);
            if (data.topSearchesByCategory) {
                UI.renderTopSearchesChart(data.topSearchesByCategory);
            }
        }
    } catch (error) {
        handleApiError(error, container);
    }
}

/**
 * Handler para recarregar os gráficos quando o tema (dark/light) muda.
 */
function handleThemeChange() {
    const { initialized } = getState();
    if (initialized) {
        loadAndRenderDashboard();
    }
}

/**
 * Função de inicialização principal para a aba de análise.
 */
async function init() {
    const container = document.getElementById('analytics-content');
    const { initialized } = getState();
    if (!container || initialized) return;

    try {
        checkAdminAuth();
        
        UI.renderPageLayout();
        await loadAndRenderDashboard();
        setupEventListeners();

        const themeObserver = new MutationObserver(handleThemeChange);
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        setState({ initialized: true });

    } catch (error) {
        if (error.message === 'AUTH_REDIRECTING') return;
        console.error("Falha ao inicializar a página de Análise:", error);
        handleApiError(error, container);
    }
}

export default { init };

