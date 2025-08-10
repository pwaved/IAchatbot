import Modal from '../../componentes/modal.js';
import { ICONS } from '../../utils/icons.js';
import { setState } from './perfil_state.js';

/**
 * Renderiza a tabela de perfis.
 * @param {Array} profiles - A lista de perfis a ser renderizada.
 */
export function renderProfilesTable(profiles) {
    const tableBody = document.getElementById('profiles-table-body');
    if (!tableBody) return;

    if (!profiles || profiles.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" class="text-center p-8 text-neutral-500 dark:text-neutral-400">Nenhum perfil encontrado.</td></tr>`;
        return;
    }

    tableBody.innerHTML = profiles.map(profile => `
        <tr class="profile-row border-b border-neutral-200 dark:border-neutral-700" data-profile-name="${profile.nome_perfil}">
            <td class="p-4 font-semibold text-neutral-800 dark:text-neutral-100">${profile.nome_perfil}</td>
            <td class="p-4 text-neutral-600 dark:text-neutral-300">${profile.descricao || '<i class="text-neutral-400">Sem descrição</i>'}</td>
            <td class="p-4 text-right">
                <button data-action="edit" data-id="${profile.id}" class="p-2 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-neutral-700 rounded-full" title="Editar">${ICONS.pencil}</button>
                <button data-action="delete" data-id="${profile.id}" class="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-neutral-700 rounded-full" title="Remover">${ICONS.trash}</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Renderiza o layout principal da página de perfis.
 */
export function renderPageLayout() {
    const content = document.getElementById('profiles-content');
    if (!content) return;

    content.innerHTML = `
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-8">
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <span class="text-brand-green">${ICONS.profiles || ICONS.users}</span>
                    <h3 class="text-2xl font-bold text-neutral-800 dark:text-white">Gerenciar Perfis</h3>
                </div>
                <p class="text-neutral-600 dark:text-neutral-400 max-w-2xl">
                    Crie e edite os perfis de usuário, que definem os níveis de acesso e permissões dentro do sistema.
                </p>
            </div>
            <button data-action="add" class="bg-brand-green hover:bg-brand-darkgreen text-white font-semibold rounded-lg px-4 py-2 transition w-full sm:w-auto flex items-center justify-center gap-2 flex-shrink-0">
                <span>${ICONS.plus}</span>
                Adicionar Perfil
            </button>
        </div>
        
        <div class="bg-white dark:bg-neutral-800/50 rounded-lg shadow-sm overflow-hidden border border-neutral-200 dark:border-neutral-700">
            <table class="w-full">
                <thead class="bg-neutral-200 dark:bg-neutral-700/50">
                    <tr>
                        <th class="p-4 text-left font-semibold text-neutral-700 dark:text-neutral-300">Nome do Perfil</th>
                        <th class="p-4 text-left font-semibold text-neutral-700 dark:text-neutral-300">Descrição</th>
                        <th class="p-4"></th>
                    </tr>
                </thead>
                <tbody id="profiles-table-body">
                    <!-- Linhas da tabela serão inseridas aqui -->
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Cria e exibe o modal do formulário de perfil.
 * @param {object} options - Opções para o modal.
 * @param {boolean} options.isEditing - Se o modal é para edição.
 * @param {object} options.profileData - Dados do perfil para preencher o formulário.
 * @param {Array} options.allPermissions - Lista de todas as permissões disponíveis.
 * @param {Function} options.onSubmit - Callback a ser executado no submit do formulário.
 */
export function showProfileFormModal({ isEditing, profileData, allPermissions, onSubmit }) {
    const modalTitle = isEditing ? 'Editar Perfil' : 'Adicionar Novo Perfil';
    const currentPermissionIds = new Set((profileData.permissoes || []).map(p => p.id));

    const permissionsHTML = allPermissions.map(perm => `
        <div class="flex items-center">
            <input id="perm-${perm.id}" name="permissoes" type="checkbox" value="${perm.id}" 
                   class="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                   ${currentPermissionIds.has(perm.id) ? 'checked' : ''}>
            <label for="perm-${perm.id}" class="ml-3 block text-sm text-neutral-700 dark:text-neutral-300">
                ${perm.descricao} <span class="text-xs text-neutral-500">(${perm.nome})</span>
            </label>
        </div>
    `).join('');

    const formContentHTML = `
        <form id="profile-form" class="space-y-6" novalidate>
            <input type="hidden" name="id" value="${profileData.id || ''}">
            <div>
                <label for="profile-name" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Nome do Perfil</label>
                <input id="profile-name" name="nome_perfil" type="text" value="${profileData.nome_perfil || ''}" placeholder="Ex: Gerente de Conteúdo" class="w-full bg-neutral-100 dark:bg-neutral-700 border dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-3" required>
            </div>
            <div>
                <label for="profile-description" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Descrição</label>
                <textarea id="profile-description" name="descricao" rows="3" class="w-full bg-neutral-100 dark:bg-neutral-700 border dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-3">${profileData.descricao || ''}</textarea>
            </div>
            <fieldset>
                <legend class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Permissões</legend>
                <div class="max-h-48 overflow-y-auto space-y-2 p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-700">
                    ${permissionsHTML}
                </div>
            </fieldset>
            <p id="profile-error-message" class="text-sm text-red-500"></p>
        </form>`;

    const formModal = new Modal({
        id: 'profile-form-modal',
        title: modalTitle,
        content: formContentHTML,
        footerButtons: [
            { text: 'Cancelar', type: 'secondary', onClick: () => formModal.destroy() },
            { text: 'Salvar', type: 'primary', onClick: () => {
                const form = formModal.modalElement.querySelector('#profile-form');
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }}
        ]
    });
    
    formModal.show();
    setState({ activeModal: formModal });

    const form = formModal.modalElement.querySelector('#profile-form');
    form.addEventListener('submit', onSubmit);
}
