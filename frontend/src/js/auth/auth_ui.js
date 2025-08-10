// /auth/auth_ui.js
import Modal from '../../componentes/modal.js';
import { ICONS } from '../../utils/icons.js';
import * as authState from './auth_state.js';
import * as authEventos from './auth_eventos.js';

// ELEMENTOS DO CABEÇALHO E MENU
export function updateHeaderUI() {
    const userMenuButton = document.getElementById('user-menu-button');
    if (!userMenuButton) return;

    const userNameSpan = userMenuButton.querySelector('span');
    const user = authState.getLoggedInUser();

    if (authState.isLoggedIn() && user) {
        userNameSpan.textContent = `Olá, ${user.nome.split(' ')[0]}`;
    } else {
        userNameSpan.textContent = 'Login';
        const dropdown = document.getElementById('user-menu-dropdown');
        if (dropdown) dropdown.classList.add('hidden');
    }
}

export function toggleUserMenu() {
    const dropdown = document.getElementById('user-menu-dropdown');
    if (!dropdown) return;

    if (dropdown.classList.contains('hidden')) {
        populateUserMenu(dropdown);
        dropdown.classList.remove('hidden');
        document.addEventListener('click', authEventos.handleOutsideClick, true);
    } else {
        dropdown.classList.add('hidden');
        document.removeEventListener('click', authEventos.handleOutsideClick, true);
    }
}

function populateUserMenu(dropdown) {
    const menuContainer = dropdown.querySelector('[role="none"]');
    menuContainer.innerHTML = '';
    const menuItemClass = 'text-neutral-700 dark:text-neutral-200 block px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-600 flex items-center gap-3 w-full text-left';

    const createMenuItem = (config) => {
        const element = config.href ? document.createElement('a') : document.createElement('button');
        element.className = menuItemClass;
        element.setAttribute('role', 'menuitem');
        if (config.href) element.href = config.href;
        element.innerHTML = `${config.icon} <span>${config.text}</span>`;
        element.onclick = (e) => {
            if (config.onClick) {
                e.preventDefault();
                config.onClick();
            }
            toggleUserMenu();
        };
        return element;
    };

    if (authState.isAdmin()) {
        menuContainer.appendChild(createMenuItem({ href: '/src/admin/index.html', icon: ICONS.adminPanel, text: 'Painel Admin' }));
    }
    if (authState.isColaborador()) {
        menuContainer.appendChild(createMenuItem({ onClick: showUserProfileModal, icon: ICONS.userProfile, text: 'Meu Perfil' }));
        menuContainer.appendChild(createMenuItem({ href: '/src/colaborador/documentos.html', icon: ICONS.knowledgeBase, text: 'Base de Conhecimento' }));
    }
    menuContainer.appendChild(createMenuItem({ onClick: showLogoutConfirmation, icon: ICONS.logout, text: 'Sair' }));
}

// --- MODAIS ---
export function showLoginModal() {
    const loginModalBackdrop = document.getElementById('login-modal-backdrop');
    if (loginModalBackdrop) {
        const errorMessageElement = document.getElementById('login-error-message');
        errorMessageElement.textContent = '';
        loginModalBackdrop.classList.remove('hidden');
    }
}

export function closeLoginModal() {
    const loginModalBackdrop = document.getElementById('login-modal-backdrop');
    if (loginModalBackdrop) {
        loginModalBackdrop.classList.add('hidden');
    }
}

export function showLogoutConfirmation() {
    if (document.getElementById('logout-confirm-modal')) return;
    const logoutModal = new Modal({
        id: 'logout-confirm-modal',
        title: 'Sair?',
        content: '<p class="dark:text-neutral-400">Tem certeza que deseja sair da sua conta?</p>',
        footerButtons: [
            { text: 'Cancelar', type: 'secondary', onClick: () => logoutModal.destroy() },
            { text: 'Sair', type: 'danger', onClick: authEventos.handleLogoutConfirm }
        ]
    });
    logoutModal.show();
}

export function showUserProfileModal() {
    if (document.getElementById('user-profile-modal')) return;
    
    const user = authState.getLoggedInUser(); 

    const modalContent = `
        <div class="max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                
                <div class="space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="bg-neutral-100 dark:bg-neutral-700 p-3 rounded-full">${ICONS.user}</span>
                        <div>
                            <p class="text-sm text-neutral-500 dark:text-neutral-400">Nome</p>
                            <p class="font-semibold text-neutral-800 dark:text-neutral-200">${user.nome}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                         <span class="bg-neutral-100 dark:bg-neutral-700 p-3 rounded-full">${ICONS.email}</span>
                        <div>
                            <p class="text-sm text-neutral-500 dark:text-neutral-400">Email</p>
                            <p class="font-semibold text-neutral-800 dark:text-neutral-200">${user.email}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                         <span class="bg-neutral-100 dark:bg-neutral-700 p-3 rounded-full">${ICONS.users}</span>
                        <div>
                            <p class="text-sm text-neutral-500 dark:text-neutral-400">Perfis de Acesso</p>
                            <p class="font-semibold text-neutral-800 dark:text-neutral-200">${user.perfis.join(', ')}</p>
                        </div>
                    </div>
                </div>

                <div class="border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-700 pt-6 md:pt-0 md:pl-6">
                    <form id="change-password-form" class="space-y-4" novalidate>
                        <h4 class="text-lg font-semibold text-neutral-800 dark:text-white flex items-center gap-2">${ICONS.lock} <span>Alterar Senha</span></h4>
                        <div>
                            <label for="current-password" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Senha Atual</label>
                            <input type="password" id="current-password" name="currentPassword" class="w-full p-2 border rounded dark:bg-neutral-600 dark:border-neutral-500" required>
                        </div>
                        <div>
                            <label for="new-password" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nova Senha</label>
                            <input type="password" id="new-password" name="newPassword" class="w-full p-2 border rounded dark:bg-neutral-600 dark:border-neutral-500" required>
                        </div>
                        <div>
                            <label for="confirm-password" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Confirmar Nova Senha</label>
                            <input type="password" id="confirm-password" name="confirmPassword" class="w-full p-2 border rounded dark:bg-neutral-600 dark:border-neutral-500" required>
                        </div>
                        <p id="password-change-message" class="text-sm h-5"></p>
                    </form>
                </div>
            </div>
        </div>
    `; 

    const userProfileModal = new Modal({
        id: 'user-profile-modal', title: 'Meu Perfil', content: modalContent,
        footerButtons: [
            { text: 'Fechar', type: 'secondary', onClick: () => userProfileModal.destroy() },
            { text: 'Salvar Alterações', type: 'primary', onClick: () => userProfileModal.modalElement.querySelector('#change-password-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })) }
        ]
    });

    userProfileModal.show();
    userProfileModal.modalElement.querySelector('#change-password-form').addEventListener('submit', authEventos.handleChangePasswordSubmit);
}

export async function showRegisterRequestModal() {
    if (document.getElementById('register-request-modal')) return;
    const profiles = await authEventos.handleFetchProfiles(); 
    const profileOptionsHtml = profiles.length > 0
        ? profiles.map(p => `<option value="${p.nome_perfil}">${p.nome_perfil}</option>`).join('')
        : '<option value="">Nenhum perfil disponível</option>';
    const modalContent = `
                <form id="register-form" class="space-y-4">
                    <div>
                        <label for="reg-name" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nome Completo</label>
                        <input type="text" id="reg-name" name="nome" placeholder="Lucian" class="w-full p-2 border rounded dark:bg-neutral-600 dark:border-neutral-500 dark:text-neutral-300" required>
                    </div>
                    <div>
                        <label for="reg-email" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
                        <input type="email" id="reg-email" name="email" placeholder="Lucian@gmail.com"  class="w-full p-2 border rounded dark:bg-neutral-600 dark:border-neutral-500 dark:text-neutral-300" required>
                    </div>
                    <div>
                        <label for="reg-password" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Senha</label>
                        <input type="password" id="reg-password" name="password" placeholder="Senha"  class="w-full p-2 border rounded dark:bg-neutral-600 dark:border-neutral-500 dark:text-neutral-300" required>
                    </div>
                    <div>
                        <label for="reg-perfil" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tipo de Perfil</label>
                        <select id="reg-perfil" name="perfil" class="w-full p-2 border rounded dark:bg-neutral-600 dark:border-neutral-500 dark:text-neutral-300" ${profiles.length === 0 ? 'disabled' : ''} required>
                            ${profileOptionsHtml}
                        </select>
                    </div>
                    <p id="register-error-message" class="text-red-500 text-sm"></p>
                </form>
            `; 
    const registerModal = new Modal({
        id: 'register-request-modal', title: 'Solicitar Cadastro', content: modalContent,
        footerButtons: [
            { text: 'Cancelar', type: 'secondary', onClick: () => registerModal.destroy() },
            { text: 'Enviar Solicitação', type: 'primary', onClick: () => registerModal.modalElement.querySelector('#register-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })) }
        ]
    });
    registerModal.show();
    registerModal.modalElement.querySelector('#register-form').addEventListener('submit', authEventos.handleRegisterSubmit);
}

export function showForgotPasswordModal() {
    if (document.getElementById('forgot-password-modal')) return;
    const modalContent = `
            <form id="forgot-password-form-dynamic" novalidate>
                <p class="mb-4 text-sm text-neutral-600 dark:text-neutral-300">
                    Insira seu e-mail e enviaremos um código de 6 dígitos para redefinir sua senha.
                </p>
                <div class="mb-2">
                    <label for="forgot-email-dynamic" class="block mb-2 dark:text-neutral-100">Email</label>
                    <input type="email" id="forgot-email-dynamic" class="w-full p-2 border rounded dark:text-white dark:bg-neutral-600 dark:border-neutral-500" required>
                </div>
                <p id="forgot-message-dynamic" class="dark:text-white text-sm h-5"></p>
            </form>
        `; 
    const forgotModal = new Modal({
        id: 'forgot-password-modal', title: 'Redefinir Senha', content: modalContent,
        footerButtons: [
            { text: 'Cancelar', type: 'secondary', onClick: () => forgotModal.destroy() },
            { text: 'Enviar Código', type: 'primary', onClick: authEventos.handleForgotPasswordRequest }
        ]
    });
    forgotModal.show();
}

export function showResetCodeModal(email) {
    if (document.getElementById('reset-code-modal')) return;
    const modalContent = `
            <form id="reset-password-form-dynamic" novalidate>
                <p class="mb-4 text-sm text-neutral-600 dark:text-neutral-300">
                    Enviamos um código de 6 dígitos para <strong>${email}</strong>. Por favor, insira-o abaixo junto com sua nova senha.
                </p>
                <div class="mb-4">
                    <label for="reset-code-dynamic" class="block mb-2 dark:text-neutral-100">Código de 6 dígitos</label>
                    <input type="text" id="reset-code-dynamic" class="w-full p-2 border rounded dark:text-white dark:bg-neutral-600 dark:border-neutral-500" required maxlength="6" pattern="\\d{6}" inputmode="numeric">
                </div>
                <div class="mb-4">
                    <label for="new-password-dynamic" class="block mb-2 dark:text-neutral-100">Nova Senha (mín. 8 caracteres)</label>
                    <input type="password" id="new-password-dynamic" class="w-full p-2 border rounded dark:text-white dark:bg-neutral-600 dark:border-neutral-500" required minlength="8">
                </div>
                <div class="mb-2">
                    <label for="confirm-password-dynamic" class="block mb-2 dark:text-neutral-100">Confirme a Nova Senha</label>
                    <input type="password" id="confirm-password-dynamic" class="w-full p-2 border rounded dark:text-white dark:bg-neutral-600 dark:border-neutral-500" required minlength="8">
                </div>
                <p id="reset-message-dynamic" class="text-sm h-5"></p>
            </form>
        `; 
    const resetModal = new Modal({
        id: 'reset-code-modal', title: 'Insira seu Código', content: modalContent,
        footerButtons: [
            { text: 'Cancelar', type: 'secondary', onClick: () => resetModal.destroy() },
            { text: 'Redefinir Senha', type: 'primary', onClick: (event) => authEventos.handleResetPasswordSubmit(event, email) }
        ]
    });
    resetModal.show();
}

