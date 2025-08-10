
import { hasPermission } from '../auth/auth_state.js';
import Modal from '../../componentes/modal.js';
import { showPermissionDeniedModal, showSuccessModal, handleApiError } from '../../utils/error-handle.js';
import * as userApi from '../../api/apiUsuarios.js';
import { getProfiles } from '../../api/apiPerfis.js';
import { ICONS } from '../../utils/icons.js';
import { loadAndRenderOperators, loadAndRenderSessions, updatePendingBadge } from './operador_main.js';
import { setState , getState } from './operador_state.js'
import { updateView , updateSessionsView} from './operador_main.js'
// Handlers para Modals 

async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const errorDisplay = form.querySelector('#form-error-display');
    errorDisplay.innerHTML = '';

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const isEditing = !!payload.id;

    if (!payload.password) delete payload.password;

    try {
        if (isEditing) {
            await userApi.updateUser(payload.id, payload);
        } else {
            await userApi.createUser(payload);
        }
        
        const modalInstance = new Modal({ id: 'operator-form-modal' });
        modalInstance.destroy();
        
        showSuccessModal(`Usuário ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
        await loadAndRenderOperators();
    } catch (error) {
        errorDisplay.innerHTML = `<div class="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md text-sm text-red-700 dark:text-red-300">${error.message}</div>`;
        errorDisplay.classList.remove('hidden');
    }
}

async function openFormModal(userId = null) {

    if (!hasPermission('MANAGE_PROFILES')) return showPermissionDeniedModal();
    
    try {
        const [profiles, userData] = await Promise.all([
            getProfiles(),
            userId ? userApi.getUserById(userId) : Promise.resolve({})
        ]);

        const profilesOptions = profiles.map(p => `<option value="${p.id}" ${userData.Perfils?.[0]?.id === p.id ? 'selected' : ''}>${p.nome_perfil}</option>`).join('');
        const isEditing = !!userId;

        const formContentHTML = `
            <form id="operator-form" class="space-y-4" novalidate>
                <input type="hidden" name="id" value="${userData.id || ''}">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label for="nome" class="block text-sm font-medium text-gray-700 dark:text-neutral-300">Nome</label><input type="text" id="nome" name="nome" value="${userData.nome || ''}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white" required></div>
                    <div><label for="email" class="block text-sm font-medium text-gray-700 dark:text-neutral-300">Email</label><input type="email" id="email" name="email" value="${userData.email || ''}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white" required></div>
                    <div><label for="password" class="block text-sm font-medium text-gray-700 dark:text-neutral-300">Nova Senha</label><input type="password" id="password" name="password" placeholder="${isEditing ? 'Deixe em branco para não alterar' : 'Senha obrigatória'}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white" ${!isEditing ? 'required' : ''}></div>
                    <div><label for="perfil_id" class="block text-sm font-medium text-gray-700 dark:text-neutral-300">Perfil</label><select id="perfil_id" name="perfil_id" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white" required><option value="">Selecione um perfil</option>${profilesOptions}</select></div>
                </div>
                <div id="form-error-display" class="hidden"></div>
            </form>`;

        const formModal = new Modal({
            id: 'operator-form-modal',
            title: isEditing ? 'Editar Usuário' : 'Criar Novo Usuário',
            content: formContentHTML,
            footerButtons: [
                { text: 'Cancelar', type: 'secondary', onClick: () => formModal.destroy() },
                { text: 'Salvar', type: 'primary', onClick: () => formModal.modalElement.querySelector('#operator-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })) }
            ]
        });
        
        formModal.modalElement.querySelector('#operator-form').addEventListener('submit', handleFormSubmit);
        formModal.show();
    } catch (error) {
        handleApiError(error);
    }
}

function openDeleteModal(userId, userName) {
    if (!hasPermission('MANAGE_USERS')) return showPermissionDeniedModal();
    const confirmationModal = new Modal({
        id: 'delete-confirmation-modal',
        title: 'Confirmar Exclusão',
        content: `<p class="dark:text-neutral-300">Você tem certeza que deseja excluir o usuário <strong>${userName}</strong>?</p>`,
        footerButtons: [
            { text: 'Cancelar', onClick: () => confirmationModal.destroy() },
            {
                text: 'Sim, Remover', type: 'danger',
                onClick: async () => {
                    try {
                        await userApi.deleteUser(userId);
                        showSuccessModal('Usuário removido com sucesso!');
                        loadAndRenderOperators();
                    } catch (error) {
                        handleApiError(error);
                    } finally {
                        confirmationModal.destroy();
                    }
                }
            }
        ]
    });
    confirmationModal.show();
}

/**
 * funcao helper para atualizar a lista de aprovacao de usuario
 * @param {Modal} modal - a instacia do modal a ser atualizada
 */
async function updateUserList(modal) {
    try {
        const pendingUsers = await userApi.getPendingUsers();
        const modalContentEl = modal.modalElement.querySelector('.modal-body-content'); 
        const modalTitleEl = modal.modalElement.querySelector('.modal-title');

        if (modalTitleEl) {
            modalTitleEl.textContent = `Aprovações Pendentes (${pendingUsers.length})`;
        }

        if (modalContentEl) {
            if (pendingUsers.length === 0) {
                modalContentEl.innerHTML = `<p class="text-center text-neutral-600 dark:text-neutral-300">Não há mais solicitações pendentes.</p>`;
            } else {
                modalContentEl.innerHTML = `<div class="overflow-x-auto"><table id="pending-users-table" class="w-full text-sm"><tbody>
                    ${pendingUsers.map(user => `
                        <tr class="border-b dark:border-neutral-700" data-user-id="${user.id}">
                            <td class="py-3 px-2"><p class="font-semibold text-neutral-800 dark:text-neutral-200">${user.nome}</p><p class="text-xs text-neutral-500 dark:text-neutral-400">${user.email}</p></td>
                            <td class="py-3 px-2 text-right whitespace-nowrap">
                                <button data-action="approve-user" class="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-neutral-700 rounded-full" title="Aprovar">${ICONS.check}</button>
                                <button data-action="reject-user" class="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-neutral-700 rounded-full ml-2" title="Rejeitar">${ICONS.userRemove}</button>
                            </td>
                        </tr>`).join('')}
                </tbody></table></div>`;
            }
        }
        
        // armazena a user list para que o event listener funcione
        modal.currentUsers = pendingUsers; 
        
        await updatePendingBadge();
    } catch (error) {
        handleApiError(error);
        modal.destroy(); // fecha o modal se falhar
    }
}


/**
 * modal de confirmação
 * @param {object} user - o objeto do usuario para ser aprovado
 * @param {Modal} pendingModal - a instancia original do modal de aprovacoes
 */
async function promptForProfileAndApprove(user, pendingModal) {
    try {
        const profiles = await getProfiles();
        const requestedProfile = user.Perfils && user.Perfils[0];
        const requestedProfileId = requestedProfile ? requestedProfile.id : null;
        const requestedProfileName = requestedProfile ? requestedProfile.nome_perfil : 'Nenhum';
        
        const profileOptions = profiles.map(p =>
            `<option value="${p.id}" ${p.id === requestedProfileId ? 'selected' : ''}>${p.nome_perfil}</option>`
        ).join('');

        const formContent = `
            <form id="approve-form">
                <p class="mb-1 dark:text-neutral-300">Usuário: <strong>${user.nome}</strong></p>
                <p class="mb-4 text-sm dark:text-neutral-400">Perfil solicitado: <span class="font-semibold text-blue-600 dark:text-blue-400">${requestedProfileName}</span></p>
                <label for="profile-select" class="block text-sm font-medium text-gray-700 dark:text-neutral-300">Confirmar ou alterar perfil:</label>
                <select id="profile-select" name="perfilId" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white" required>
                    <option value="">-- Selecione um perfil --</option>
                    ${profileOptions}
                </select>
            </form>
        `;

        const approvalConfirmModal = new Modal({
            id: 'approval-confirm-modal',
            title: `Aprovar Usuário`,
            content: formContent,
            footerButtons: [
                { text: 'Cancelar', type: 'secondary', onClick: () => approvalConfirmModal.destroy() },
                {
                    text: 'Confirmar Aprovação',
                    type: 'primary',
                    onClick: async () => {
                        const form = document.getElementById('approve-form');
                        const selectedPerfilId = form.querySelector('#profile-select').value;

                        if (!selectedPerfilId) {
                            handleApiError({ message: 'Você precisa selecionar um perfil para o usuário.' });
                            return;
                        }

                        try {
                            await userApi.approveUser(user.id, selectedPerfilId);
                            showSuccessModal('Usuário aprovado com sucesso!');
                            
                            // fecha o modal de confirmaacao
                            approvalConfirmModal.destroy();
                            
                            // atualiza a userlist do modal de aprovacoes pendentes
                            await updateUserList(pendingModal);
                            
                            // atualiza a tabela de usuarios
                            await loadAndRenderOperators();

                        } catch (error) {
                            handleApiError(error);
                        }
                    }
                }
            ]
        });
        approvalConfirmModal.show();
    } catch (error) {
        handleApiError(error);
    }
}

/**
 * funcao principal para o modal de usuario para aprovação
 */
async function openPendingUsersModal() {
    if (!hasPermission('APPROVE_USERS')) return showPermissionDeniedModal();

    const pendingModal = new Modal({
        id: 'pending-users-modal',
        title: 'Lista de Usuários Pendentes',
        content: '<div class="modal-body-content"><p class="text-center dark:text-white">Buscando solicitações...</p></div>',
        footerButtons: [{ text: 'Fechar', type: 'secondary', onClick: () => pendingModal.destroy() }]
    });
    
    pendingModal.currentUsers = [];

    pendingModal.modalElement.addEventListener('click', async (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const row = event.target.closest('tr');
        if (!action || !row) return;

        const userId = row.dataset.userId;
        const userObject = pendingModal.currentUsers.find(u => u.id == userId);
        if (!userObject) return;

        if (action === 'approve-user') {
            await promptForProfileAndApprove(userObject, pendingModal);
        } else if (action === 'reject-user') {
            try {
                await userApi.rejectUser(userObject.id);
                showSuccessModal('Usuário rejeitado com sucesso!');
                // atualiza a UI
                await updateUserList(pendingModal);
            } catch (error) {
                handleApiError(error);
            }
        }
    });

    pendingModal.show();
    

    await updateUserList(pendingModal);
}

function openRevokeSessionModal(sessionId, userName) {
    if (!hasPermission('REVOKE_USER_SESSIONS')) return showPermissionDeniedModal();
    const confirmationModal = new Modal({
        id: 'revoke-session-modal',
        title: 'Confirmar Revogação',
        content: `<p class="dark:text-neutral-300">Você tem certeza que deseja encerrar a sessão do usuário <strong>${userName}</strong>? Ele será desconectado imediatamente.</p>`,
        footerButtons: [
            { text: 'Cancelar', onClick: () => confirmationModal.destroy() },
            {
                text: 'Sim, Encerrar Sessão', type: 'danger',
                onClick: async () => {
                    try {
                        await userApi.revokeSession(sessionId);
                        showSuccessModal('Sessão encerrada com sucesso!');
                        const accessControlTab = document.getElementById('access-control-content');
                        if (!accessControlTab.classList.contains('hidden')) {
                            const { loadAndRenderSessions } = await import('./operador_main.js');
                            loadAndRenderSessions();
                        }
                    } catch (error) {
                        handleApiError(error);
                    } finally {
                        confirmationModal.destroy();
                    }
                }
            }
        ]
    });
    confirmationModal.show();
}




// --- Tab Handling ---

function handleTabClick(clickedTab) {
    document.querySelectorAll('[role="tabpanel"]').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('[role="tab"]').forEach(t => {
        t.setAttribute('aria-selected', 'false');
        t.className = 'inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:text-white dark:hover:border-neutral-600';
    });

    const contentId = `${clickedTab.dataset.tab}-content`;
    document.getElementById(contentId)?.classList.remove('hidden');
    clickedTab.setAttribute('aria-selected', 'true');
    clickedTab.className = 'inline-block p-4 text-brand-green border-b-2 border-brand-green rounded-t-lg active dark:text-brand-green dark:border-brand-green';

    if (contentId === 'access-control-content') {
        loadAndRenderSessions();
    }
}

// --- Main Event Listener Setup ---

export function setupEventListeners(updateView, updateSessionsView) {
    const content = document.getElementById('operators-content');
    if (!content || content.dataset.listenerAttached) return;

    content.addEventListener('click', (event) => {
        const actionButton = event.target.closest('[data-action]');
        if (!actionButton) return;
        const action = actionButton.dataset.action;

        // 
        switch (action) {
            case 'operator-prev-page': 
                if (!actionButton.disabled) {
                    let { currentPage } = getState();
                    setState({ currentPage: currentPage - 1 });
                    updateView();
                }
                break;
            

            case 'operator-next-page':
                if (!actionButton.disabled) {
                    let { currentPage } = getState();
                    setState({ currentPage: currentPage + 1 });
                    updateView();
                }
                break;
            
            case 'add':
                openFormModal();
                break;
            
            case 'edit':
                openFormModal(actionButton.dataset.id);
                break;
            
            case 'delete':
                openDeleteModal(actionButton.dataset.id, actionButton.dataset.nome);
                break;
            
            case 'show-pending':
                openPendingUsersModal();
                break;
            
            case 'revoke-session':
                openRevokeSessionModal(actionButton.dataset.sessionId, actionButton.dataset.userName);
                break;

            case 'session-prev-page':
                if (!actionButton.disabled) {
                    let { sessionsCurrentPage } = getState();
                    setState({ sessionsCurrentPage: sessionsCurrentPage - 1 });
                    updateSessionsView();
                }
                break;
            
            case 'session-next-page':
                if (!actionButton.disabled) {
                    let { sessionsCurrentPage } = getState();
                    setState({ sessionsCurrentPage: sessionsCurrentPage + 1 });
                    updateSessionsView();
                }
                break;
            
            case 'tab-click':
                handleTabClick(actionButton);
                break;
        }
    });

    content.dataset.listenerAttached = 'true';
}