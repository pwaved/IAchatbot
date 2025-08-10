import Modal from '../componentes/modal.js';
import { ICONS } from './icons.js';

/**
 * Exibe um modal de sucesso genérico.
 * @param {string} message - A mensagem a ser exibida.
 */
export function showSuccessModal(message) {
    document.getElementById('success-modal')?.remove();
    const successModal = new Modal({
        id: 'success-modal',
        title: 'Sucesso!',
        content: `<p class="text-neutral-700 dark:text-neutral-300">${message}</p>`,
        footerButtons: [{ text: 'OK', type: 'primary', onClick: () => successModal.destroy() }]
    });
    successModal.show();
}

/**
 * Exibe um modal de erro genérico.
 * @param {string} title - O título do modal.
 * @param {string} message - A mensagem de erro.
 */
export function showErrorModal(title, message) {
    document.getElementById('error-modal')?.remove();
    const errorModal = new Modal({
        id: 'error-modal',
        title: title,
        content: `<p class="text-red-500">${message}</p>`,
        footerButtons: [{ text: 'OK', type: 'danger', onClick: () => errorModal.destroy() }]
    });
    errorModal.show();
}

/**
 * Renderiza uma mensagem de acesso negado dentro de um container.
 * (Função interna, não precisa ser exportada)
 * @param {HTMLElement} containerElement - O elemento onde a mensagem será inserida.
 */
function renderAccessDenied(containerElement) {
    if (!containerElement) return;
    containerElement.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full p-8 text-center bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
            <span class="text-5xl text-yellow-500 mb-4">${ICONS.lock || '🔒'}</span>
            <h3 class="text-2xl font-bold text-neutral-800 dark:text-white">Acesso Negado</h3>
            <p class="text-neutral-600 dark:text-neutral-400 mt-2 max-w-md">
                Você não possui a permissão necessária para visualizar este conteúdo. Se acredita que isso é um erro, entre em contato com um administrador.
            </p>
        </div>
    `;
}
function showSessionExpiredModal() {
    document.getElementById('session-expired-modal')?.remove();
    const sessionModal = new Modal({
        id: 'session-expired-modal',
        title: 'Sessão Expirada',
        content: '<p class="text-neutral-700 dark:text-neutral-300">Sua sessão é inválida ou expirou. Por favor, faça o login novamente para continuar.</p>',
        footerButtons: [{ 
            text: 'OK, fazer login', 
            type: 'primary', 
            onClick: () => {
                // Limpa os dados de sessão do localStorage
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                // Recarrega a página, o que irá efetivamente deslogar o usuário e levá-lo à tela de login.
                window.location.href = '/';
            } 
        }]
    });
    sessionModal.show();
}
/**
 * Exibe um modal padrão para quando uma ação é negada por falta de permissão.
 * Pode ser chamado diretamente de um event listener.
 */
export function showPermissionDeniedModal() {
    document.getElementById('permission-denied-modal')?.remove();
    const permModal = new Modal({
        id: 'permission-denied-modal',
        title: 'Acesso Negado',
        content: '<p class="text-neutral-700 dark:text-neutral-300">Você não tem a permissão necessária para executar esta ação.</p>',
        footerButtons: [{ text: 'OK', type: 'primary', onClick: () => permModal.destroy() }]
    });
    permModal.show();
}

/**
 * Analisa um erro da API e exibe a mensagem apropriada na UI.
 * @param {Error} error - O objeto de erro capturado (deve ter error.status).
 * @param {HTMLElement} containerElement - O container do conteúdo da aba.
 */
export function handleApiError(error, containerElement) {
    console.error('Falha na API:', error);

    if (error.status === 401) {
        // Trata o erro de sessão inválida/expirada
        showSessionExpiredModal();
    }
    else if (error.status === 403 || (typeof error.message === 'string' && error.message.includes('403'))) {
        // Trata o erro de Permissão
        renderAccessDenied(containerElement);
    } else {
        // Outros erros (Rede, Servidor 500, etc.)
        if (containerElement) {
            containerElement.innerHTML = `
                <div class="p-8 text-center text-red-500">
                    <p class="font-semibold">Não foi possível carregar os dados.</p>
                    <p class="text-sm text-neutral-500 mt-2">${error.message || 'Erro desconhecido.'}</p>
                </div>
            `;
        }
        showErrorModal('Erro Inesperado', 'Não foi possível completar sua solicitação. Verifique sua conexão ou tente novamente mais tarde.');
    }
}