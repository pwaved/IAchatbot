// Mantém o estado centralizado para o módulo de operadores.

const state = {
    operators: [],
    pendingUsers: [],
    activeSessions: [],
    activeModal: null,
    currentPage: 1,
    operatorsPerPage: 10,
    sessionsCurrentPage: 1,
    sessionsPerPage: 5
};

/**
 * Retorna uma cópia do estado atual para leitura segura.
 * @returns {object} Uma cópia do objeto de estado.
 */
export function getState() {
    return { ...state };
}

/**
 * Atualiza o estado do módulo de forma centralizada.
 * @param {object} newState - Um objeto contendo as chaves do estado a serem atualizadas.
 */
export function setState(newState) {
    Object.assign(state, newState);
}
