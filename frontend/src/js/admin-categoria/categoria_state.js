// Mantém o estado centralizado para o módulo de categorias.

const state = {
    categories: [],
    activeModal: null,
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
