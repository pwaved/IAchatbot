
import { ICONS } from '../../utils/icons.js';


/**
 * Renderiza a tabela de operadores.
 * @param {Array} operators - A lista de operadores.
 */
export function renderOperatorsTable(operators) {
    const container = document.getElementById('operators-table-body');
    if (!container) return;

    if (!operators || operators.length === 0) {
        container.innerHTML = `<div class="text-center py-8 px-4 text-neutral-600 dark:text-neutral-300">Nenhum usuário encontrado.</div>`;
        return;
    }

    container.innerHTML = operators.map(op => {
        const perfil = op.Perfils?.[0]?.nome_perfil || 'Indefinido';
        const perfilClass = perfil === 'Administrador' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        const statusBadge = op.aprovado ? `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Aprovado</span>` : `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pendente</span>`;
        const actionButtons = op.aprovado
            ? `<button data-action="edit" data-id="${op.id}" class="p-2 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-neutral-700 rounded-full" title="Editar">${ICONS.pencil}</button>
               <button data-action="delete" data-id="${op.id}" data-nome="${op.nome}" class="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-neutral-700 rounded-full" title="Remover">${ICONS.trash}</button>`
            : `<span class="text-xs text-neutral-500 dark:text-neutral-400">Aguardando aprovação</span>`;
        
        return `
            <tr class="block lg:table-row mb-4 lg:mb-0 border lg:border-0 rounded-lg lg:rounded-none border-neutral-200 dark:border-neutral-700">
                <td data-label="Nome" class="block lg:table-cell p-3 lg:p-4 text-right lg:text-left border-b lg:border-b-0 border-neutral-200 dark:border-neutral-700/50 before:content-[attr(data-label)':_'] before:float-left before:font-semibold lg:before:content-none text-neutral-800 dark:text-neutral-200">${op.nome}</td>
                <td data-label="Email" class="block lg:table-cell p-3 lg:p-4 text-right lg:text-left border-b lg:border-b-0 border-neutral-200 dark:border-neutral-700/50 before:content-[attr(data-label)':_'] before:float-left before:font-semibold lg:before:content-none text-neutral-600 dark:text-neutral-400">${op.email}</td>
                <td data-label="Status" class="block lg:table-cell p-3 lg:p-4 text-right lg:text-left border-b lg:border-b-0 border-neutral-200 dark:border-neutral-700/50 before:content-[attr(data-label)':_'] before:float-left before:font-semibold lg:before:content-none text-neutral-600 dark:text-neutral-400">${statusBadge}</td>
                <td data-label="Perfil" class="block lg:table-cell p-3 lg:p-4 text-right lg:text-left border-b lg:border-b-0 border-neutral-200 dark:border-neutral-700/50 before:content-[attr(data-label)':_'] before:float-left before:font-semibold lg:before:content-none text-neutral-600 dark:text-neutral-400"><span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${perfilClass}">${perfil}</span></td>
                <td data-label="Ações" class="block lg:table-cell p-3 lg:p-4 text-right lg:text-left"><div class="flex justify-end lg:justify-center space-x-2">${actionButtons}</div></td>
            </tr>`;
    }).join('');
}


/**
 * Renderiza os controles de paginação de forma genérica.
 * @param {number} totalItems - O número total de itens.
 * @param {number} currentPage - A página atual.
 * @param {number} itemsPerPage - Itens por página.
 * @param {string} containerId - O ID do elemento container da paginação.
 * @param {string} actionPrefix - Um prefixo para as ações dos botões (ex: 'user', 'session').
 */
export function renderPagination(totalItems, currentPage, itemsPerPage, containerId, actionPrefix) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (totalItems <= itemsPerPage) {
        container.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const summary = `Mostrando ${startIndex + 1} - ${Math.min(startIndex + itemsPerPage, totalItems)} de ${totalItems}`;

    container.innerHTML = `
        <span class="text-sm text-gray-600 dark:text-gray-400">${summary}</span>
        <div class="flex gap-2">
            <button data-action="${actionPrefix}-prev-page" class="dark:text-white px-3 py-1 border rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1" ${currentPage === 1 ? 'disabled' : ''}>
                ${ICONS.arrowLeft}Anterior
            </button>
            <button data-action="${actionPrefix}-next-page" class="dark:text-white px-3 py-1 border rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1" ${currentPage >= totalPages ? 'disabled' : ''}>
                Próxima${ICONS.arrowRight}
            </button>
        </div>
    `;
}

/**
 * Formata o tempo restante em uma string legível.
 * @param {string} expirationDateString - A data de expiração em formato ISO.
 * @returns {string}
 */
function formatTimeRemaining(expirationDateString) {
    const now = new Date();
    const expiration = new Date(expirationDateString);
    const diffMs = expiration - now;

    if (diffMs <= 0) return '<span class="text-red-500">Expirada</span>';
    const diffMinutes = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);

    if (diffHours > 1) return `em ${diffHours} horas`;
    if (diffMinutes > 0) return `em ${diffMinutes} minutos`;
    return 'expirando...';
}

/**
 * Renderiza a tabela de sessões ativas.
 * @param {Array} sessions - A lista de sessões ativas.
 */
export function renderActiveSessionsTable(sessions) {
    const container = document.getElementById('active-sessions-content');
    if (!container) return;

    if (!sessions || sessions.length === 0) {
        container.innerHTML = `<p class="text-center text-neutral-600 dark:text-neutral-300 py-4">Nenhuma sessão ativa encontrada. ✨</p>`;
        return;
    }

    const tableRows = sessions.map(session => `
        <tr class="block lg:table-row mb-4 lg:mb-0 border lg:border-0 rounded-lg lg:rounded-none border-neutral-200 dark:border-neutral-700">
            <td data-label="Usuário" class="block dark:text-white lg:table-cell p-3 lg:p-4 text-right lg:text-left border-b lg:border-b-0 dark:border-neutral-700/50 before:content-[attr(data-label)':_'] before:float-left before:font-semibold lg:before:content-none">
                <p class="font-semibold text-neutral-800 dark:text-neutral-200">${session.user.nome}</p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">${session.user.email}</p>
            </td>
            <td data-label="Último Login" class="block lg:table-cell p-3 lg:p-4 text-right lg:text-left border-b lg:border-b-0 dark:border-neutral-700/50 before:content-[attr(data-label)':_'] before:float-left before:font-semibold lg:before:content-none text-neutral-600 dark:text-neutral-400">
                ${new Date(session.cookie.expires).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </td>
            <td data-label="Expira" class="block lg:table-cell p-3 lg:p-4 text-right lg:text-left border-b lg:border-b-0 dark:border-neutral-700/50 before:content-[attr(data-label)':_'] before:float-left before:font-semibold lg:before:content-none text-neutral-600 dark:text-neutral-400">
                ${formatTimeRemaining(session.cookie.expires)}
            </td>
            <td data-label="Ações" class="block lg:table-cell p-3 lg:p-4 text-right lg:text-left">
                <div class="flex justify-end lg:justify-center">
                    <button data-action="revoke-session" data-session-id="${session.id}" data-user-name="${session.user.nome}" class="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 dark:hover:text-red-400 font-semibold" title="Encerrar esta sessão">
                        <span>${ICONS.logout}</span> Revogar
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="bg-white dark:bg-neutral-800 border dark:text-white border-neutral-200 dark:border-neutral-700 shadow-sm rounded-lg overflow-hidden">
            <table class="w-full border-collapse">
                <thead class="hidden lg:table-header-group bg-neutral-50 dark:bg-neutral-800/50">
                    <tr class="bg-neutral-200 dark:bg-neutral-700/50">
                        <th class="text-left py-3 px-4 font-semibold text-neutral-800 dark:text-white">Usuário</th>
                        <th class="text-left py-3 px-4 font-semibold text-neutral-800 dark:text-white">Login em</th>
                        <th class="text-left py-3 px-4 font-semibold text-neutral-800 dark:text-white">Expira</th>
                        <th class="text-center py-3 px-4 font-semibold text-neutral-800 dark:text-white">Ações</th>
                    </tr>
                </thead>
                <tbody class="block lg:table-row-group">${tableRows}</tbody>
            </table>
        </div>
    `;
}

/**
 * Atualiza o contador no botão de aprovações pendentes.
 * @param {number} count - O número de usuários pendentes.
 */
export function updatePendingButtonBadge(count) {
    const badge = document.getElementById('pending-btn-badge');
    if (!badge) return;
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
}

/**
 * Renderiza o layout principal da página de operadores.
 */
export function renderPageLayout() {
    const container = document.getElementById('operators-content');
    if (!container) return;

    container.innerHTML = `
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <span class="text-brand-green">${ICONS.users}</span>
                    <h3 class="text-2xl font-bold text-neutral-800 dark:text-white">Configurações de Usuários</h3>
                </div>
                <p class="text-neutral-600 dark:text-neutral-400 max-w-2xl">Gerencie usuários, perfis de acesso e sessões ativas no sistema.</p>
            </div>
            <div class="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2 w-full lg:w-auto flex-shrink-0">
                <button data-action="show-pending" class="relative bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg px-4 py-2 transition w-full sm:w-auto flex items-center justify-center gap-2">
                    <span>${ICONS.bell}</span> Aprovações Pendentes
                    <span id="pending-btn-badge" class="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full hidden"></span>
                </button>
                <button data-action="add" class="bg-brand-green hover:bg-brand-darkgreen text-white font-semibold rounded-lg px-4 py-2 transition w-full sm:w-auto flex items-center justify-center gap-2">
                    <span>${ICONS.userAdd}</span> Criar Novo Usuário
                </button>
            </div>
        </div>
        <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
            <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" id="user-tabs" role="tablist">
                <li role="presentation"><button class="inline-block p-4 border-b-2 rounded-t-lg" data-action="tab-click" data-tab="manage-users" role="tab">Gerenciar Usuários</button></li>
                <li role="presentation"><button class="inline-block p-4 border-b-2 rounded-t-lg" data-action="tab-click" data-tab="access-control" role="tab">Controle de Acesso e Sessões</button></li>
            </ul>
        </div>
        <div id="user-tabs-content">
            <div id="manage-users-content" role="tabpanel">
                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm rounded-lg overflow-hidden">
                    <table class="w-full border-collapse">
                        <thead class="hidden lg:table-header-group bg-neutral-50 dark:bg-neutral-800/50">
                            <tr class="bg-neutral-200 dark:bg-neutral-700/50">
                                <th class="text-left py-3 px-4 font-semibold text-neutral-800 dark:text-white">Nome</th>
                                <th class="text-left py-3 px-4 font-semibold text-neutral-800 dark:text-white">Email</th>
                                <th class="text-left py-3 px-4 font-semibold text-neutral-800 dark:text-white">Status</th>
                                <th class="text-left py-3 px-4 font-semibold text-neutral-800 dark:text-white">Perfil</th>
                                <th class="text-center py-3 px-4 font-semibold text-neutral-800 dark:text-white">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="operators-table-body" class="block lg:table-row-group"></tbody>
                    </table>
                </div>
                
                <div id="operators-pagination-container" class="mt-6 py-4 flex justify-between items-center"></div>

            </div>
            <div id="access-control-content" class="hidden" role="tabpanel">
                <h4 class="text-xl font-semibold mb-4 dark:text-white">Sessões Ativas</h4>
                <p class="dark:text-neutral-300">Visualize quem está logado no sistema e encerre sessões se necessário.</p>
                <div id="active-sessions-content" class="mt-4"></div>

                <div id="sessions-pagination-container" class="mt-6 py-4 flex justify-between items-center"></div>
                
            </div>
        </div>
    `;
}
