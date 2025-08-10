// Mantém o estado centralizado para o módulo de análise.

const state = {
    initialized: false,
    modal: {
        currentPage: 1,
        filters: {}
    },
    charts: {
        feedbackChart: null,
        categoryChart: null,
        subcategoryChart: null,
        topSearchesChart: null,
    }
};

/**
 * Retorna o objeto de estado completo.
 */
export function getState() {
    return state;
}

/**
 * Atualiza o estado de nível superior.
 * @param {object} newState - Novas chaves para o estado.
 */
export function setState(newState) {
    Object.assign(state, newState);
}

/**
 * Atualiza o estado específico do modal.
 * @param {object} newModalState - Novas chaves para o estado do modal.
 */
export function setModalState(newModalState) {
    Object.assign(state.modal, newModalState);
}

/**
 * Armazena uma instância de gráfico. Destroi a instância anterior no mesmo canvas
 * e depois executa a factory function para criar a nova.
 * @param {string} chartName - A chave para o gráfico (e.g., 'feedbackChart').
 * @param {Function} chartFactory - Uma função que retorna uma nova instância do Chart.js.
 */
export function setChartInstance(chartName, chartFactory) {
    // Primeiro, destrói o gráfico antigo, se ele existir.
    if (state.charts[chartName]) {
        state.charts[chartName].destroy();
    }
    // Agora, executa a função para criar e armazenar o novo gráfico.
    state.charts[chartName] = chartFactory();
}
