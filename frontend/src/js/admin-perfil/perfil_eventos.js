import { hasPermission } from '../auth/auth_state.js';
import Modal from '../../componentes/modal.js';
import { showPermissionDeniedModal, showSuccessModal, showErrorModal, handleApiError } from '../../utils/error-handle.js';
import * as profileApi from '../../api/apiPerfis.js';
import { showProfileFormModal } from './perfil_ui.js';
import { loadAndRenderProfiles, loadAllPermissions } from './perfil_main.js';

const requiredPermission = 'MANAGE_PROFILES';

async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const errorMessageEl = form.querySelector('#profile-error-message');
    errorMessageEl.textContent = '';
    
    const id = form.querySelector('input[name="id"]').value;
    const isEditing = !!id;
    const nome_perfil = form.querySelector('#profile-name').value.trim();

    if (!nome_perfil) {
        errorMessageEl.textContent = 'O nome do perfil é obrigatório.';
        return;
    }

    const selectedPermissionIds = Array.from(form.querySelectorAll('input[name="permissoes"]:checked'))
        .map(cb => parseInt(cb.value, 10));

    const payload = {
        nome_perfil,
        descricao: form.querySelector('#profile-description').value.trim(),
        permissoes: selectedPermissionIds
    };

    try {
        if (isEditing) {
            await profileApi.updateProfile(id, payload);
        } else {
            await profileApi.createProfile(payload);
        }
        
        const modalInstance = new Modal({ id: 'profile-form-modal' });
        modalInstance.destroy();
        
        showSuccessModal(`Perfil ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
        await loadAndRenderProfiles();
    } catch (error) {
        errorMessageEl.textContent = error.data?.error || error.message || 'Erro desconhecido ao salvar.';
    }
}

async function openFormModal(profileId = null) {
    if (!hasPermission(requiredPermission)) {
        return showPermissionDeniedModal();
    }
    try {
        const allPermissions = await loadAllPermissions();
        const profileData = profileId ? await profileApi.getProfileById(profileId) : {};
        
        showProfileFormModal({
            isEditing: !!profileId,
            profileData,
            allPermissions,
            onSubmit: handleFormSubmit
        });
    } catch (error) {
        handleApiError(error);
    }
}

function openDeleteModal(profileId, profileName) {
    if (!hasPermission(requiredPermission)) {
        return showPermissionDeniedModal();
    }
    const deleteModal = new Modal({
        id: 'delete-profile-modal',
        title: 'Confirmar Remoção',
        content: `<p class="dark:text-neutral-300">Você tem certeza que deseja remover o perfil "<strong>${profileName}</strong>"?</p>`,
        footerButtons: [
            { text: 'Cancelar', type: 'secondary', onClick: () => deleteModal.destroy() },
            {
                text: 'Sim, Remover',
                type: 'danger',
                onClick: async () => {
                    try {
                        await profileApi.deleteProfile(profileId);
                        showSuccessModal('Perfil removido com sucesso!');
                        await loadAndRenderProfiles();
                    } catch (error) {
                        if (error.status === 409) {
                            showErrorModal('Ação Bloqueada', error.data.error);
                        } else {
                            handleApiError(error);
                        }
                    } finally {
                        deleteModal.destroy();
                    }
                }
            }
        ]
    });
    deleteModal.show();
}

function handleClick(event) {
    const target = event.target;
    const action = target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    const id = target.closest('[data-id]')?.dataset.id;

    switch (action) {
        case 'add':
            openFormModal();
            break;
        case 'edit':
            openFormModal(id);
            break;
        case 'delete': {
            const row = target.closest('.profile-row');
            const profileName = row?.dataset.profileName || 'este perfil';
            openDeleteModal(id, profileName);
            break;
        }
    }
}

export function setupEventListeners() {
    const content = document.getElementById('profiles-content');
    if (!content || content.dataset.listenerAttached) return;

    content.addEventListener('click', handleClick);
    content.dataset.listenerAttached = 'true';
}