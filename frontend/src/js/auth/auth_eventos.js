// /auth/auth_eventos.js
import * as authMain from './auth_main.js';
import * as authUI from './auth_ui.js';
import * as authState from './auth_state.js';
import Modal from '../../componentes/modal.js';

// --- HANDLERS DE EVENTOS PRINCIPAIS ---
export function initializeEventListeners() {
    const userMenuButton = document.getElementById('user-menu-button');
    const loginForm = document.getElementById('login-form');
    
    if (userMenuButton) {
        userMenuButton.addEventListener('click', () => {
            if (authState.isLoggedIn()) {
                authUI.toggleUserMenu();
            } else {
                authUI.showLoginModal();
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
        document.getElementById('close-modal-button').addEventListener('click', authUI.closeLoginModal);
        document.getElementById('forgot-password-link').addEventListener('click', handleForgotPasswordClick);
        loginForm.querySelector('button[type="button"]').addEventListener('click', handleRegisterRequestClick);
    }
}

export function handleOutsideClick(event) {
    const dropdown = document.getElementById('user-menu-dropdown');
    const button = document.getElementById('user-menu-button');
    if (dropdown && !dropdown.classList.contains('hidden') && !button.contains(event.target) && !dropdown.contains(event.target)) {
        authUI.toggleUserMenu();
    }
}

// --- HANDLERS PARA AÇÕES DE MODAL ---
async function handleLoginSubmit(event) {
    event.preventDefault();
    const errorMessageElement = document.getElementById('login-error-message');
    const email = event.target.querySelector('#email').value;
    const password = event.target.querySelector('#password').value;
    
    errorMessageElement.textContent = '';
    try {
        await authMain.handleLogin(email, password);
    } catch (error) {
        errorMessageElement.textContent = error.message;
    }
}

function handleForgotPasswordClick(event) {
    event.preventDefault();
    authUI.closeLoginModal();
    authUI.showForgotPasswordModal();
}

function handleRegisterRequestClick() {
    authUI.closeLoginModal();
    authUI.showRegisterRequestModal();
}

export async function handleLogoutConfirm() {
    await authMain.handleLogout();
    // A destruição do modal e o redirecionamento acontecerão dentro do handleLogout
}

export async function handleChangePasswordSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const messageEl = form.querySelector('#password-change-message');
    const currentPassword = form.querySelector('#current-password').value;
    const newPassword = form.querySelector('#new-password').value;
    const confirmPassword = form.querySelector('#confirm-password').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        messageEl.textContent = 'Por favor, preencha todos os campos.';
        messageEl.className = 'text-sm h-5 text-red-500';
        return;
    }
    if (newPassword !== confirmPassword) {
        messageEl.textContent = 'A nova senha e a confirmação não coincidem.';
        messageEl.className = 'text-sm h-5 text-red-500';
        return;
    }

    try {
        await authMain.handleChangePassword({ currentPassword, newPassword });
        messageEl.textContent = 'Senha alterada com sucesso!';
        messageEl.className = 'text-sm h-5 text-green-500';
        form.reset();
    } catch (error) {
        messageEl.textContent = error.message || 'Erro ao alterar a senha.';
        messageEl.className = 'text-sm h-5 text-red-500';
    }
}

export async function handleRegisterSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const errorMessageElement = form.querySelector('#register-error-message');
    const payload = {
        nome: form.querySelector('#reg-name').value.trim(),
        email: form.querySelector('#reg-email').value.trim(),
        password: form.querySelector('#reg-password').value.trim(),
        perfil: form.querySelector('#reg-perfil').value,
    };
    
    if (!payload.nome || !payload.email || !payload.password || !payload.perfil) {
        errorMessageElement.textContent = 'Por favor, preencha todos os campos.';
        return;
    }

    try {
        const responseData = await authMain.handleRegistration(payload);
        document.getElementById('register-request-modal')?.remove(); // Destroi o modal antigo
        const successModal = new Modal({
            id: 'register-success-modal',
            title: 'Solicitação Enviada!',
            content: `<p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">${responseData.message || 'Aguarde a aprovação.'}</p>`,
            footerButtons: [{ text: 'OK', type: 'primary', onClick: () => successModal.destroy() }]
        });
        successModal.show();
    } catch (error) {
        errorMessageElement.textContent = error.message;
    }
}

export async function handleForgotPasswordRequest(event) {
    // Mantemos a referência ao botão para desabilitá-lo
    const button = event.target;

    // encontramos o contêiner do modal diretamente pelo seu ID, que é mais seguro.
    const modalContainer = document.getElementById('forgot-password-modal');
    if (!modalContainer) {
        console.error("Não foi possível encontrar o modal 'forgot-password-modal'.");
        return;
    }

    // A partir do contêiner, encontramos os outros elementos.
    const form = modalContainer.querySelector('form');
    const emailInput = form.querySelector('#forgot-email-dynamic');
    const messageElement = form.querySelector('#forgot-message-dynamic');
    const email = emailInput.value;

    if (!form.checkValidity()) {
        messageElement.textContent = 'Por favor, insira um e-mail válido.';
        return;
    }

    button.disabled = true;
    button.textContent = 'Enviando...';
    
    try {
        await authMain.handleRequestPasswordReset(email);
        // O modal agora é removido pela sua própria instância ou pela função que o chama.
        modalContainer.remove();
        authUI.showResetCodeModal(email);
    } catch (error) {
        messageElement.textContent = error.message;
        button.disabled = false;
        button.textContent = 'Enviar Código';
    }
}

export async function handleResetPasswordSubmit(event, email) {
    // Mantemos a referência ao botão para desabilitá-lo
    const button = event.target;

    //  Encontramos o modal pelo seu ID em vez de subir pelo DOM.
    const modalContainer = document.getElementById('reset-code-modal');
    if (!modalContainer) {
        return;
    }

    // A partir do contêiner, encontramos os outros elementos.
    const form = modalContainer.querySelector('form');
    const messageElement = form.querySelector('#reset-message-dynamic');
    const codeInput = form.querySelector('#reset-code-dynamic');
    const newPasswordInput = form.querySelector('#new-password-dynamic');
    const confirmPasswordInput = form.querySelector('#confirm-password-dynamic');

    if (newPasswordInput.value !== confirmPasswordInput.value) {
        messageElement.textContent = 'As senhas não coincidem.';
        messageElement.className = 'dark:text-white'
        return;
    }
    if (!form.checkValidity()) {
        messageElement.textContent = 'Por favor, preencha todos os campos corretamente.';
        messageElement.className = 'dark:text-white'
        return;
    }
    
    button.disabled = true;
    button.textContent = 'Verificando...';
    
    try {
        const data = await authMain.handleResetPassword({
            email: email,
            code: codeInput.value,
            newPassword: newPasswordInput.value
        });

        modalContainer.remove(); // Remove o modal atual

        const successModal = new Modal({
            id: 'reset-success-modal',
            title: 'Sucesso!',
            content: `<p class="dark:text-neutral-400">${data.message}</p>`,
            footerButtons: [{ text: 'OK', type: 'primary', onClick: () => successModal.destroy() }]
        });
        successModal.show();
        
    } catch (error) {
        messageElement.textContent = error.message;
        button.disabled = false;
        button.textContent = 'Redefinir Senha';
    }
}

export async function handleFetchProfiles() {
    try {
        return await authMain.fetchProfilesForRegistration();
    } catch (error) {
        console.error('Error fetching profiles:', error);
        return [];
    }
}