import Chart from 'chart.js/auto';
import { ICONS } from '../../utils/icons.js';
import { setChartInstance } from './analise_state.js';

/**
 * Updates Chart.js default colors based on the current theme.
 */
function updateChartDefaults() {
    const isDarkMode = document.documentElement.classList.contains('dark');
    const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.85)' : '#374151';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    Chart.defaults.color = textColor;
    Chart.defaults.scale.grid.color = gridColor;
}

/**
 * Renderiza todos os gráficos principais da página.
 * @param {object} data - O objeto de dados da API.
 */
export function renderAllCharts(data) {
    if (!data) return;
    updateChartDefaults();

    const feedbackStats = data.feedbackStats || [];
    const categoryStats = data.categoryStats || [];
    const subcategoryStats = data.subcategoryStats || [];
    const isDark = document.documentElement.classList.contains('dark');
    const chartBorderColor = isDark ? '#27272a' : '#ffffff';

    // Feedback Chart
    const usefulCount = feedbackStats.find(item => item.satisfatorio === true)?.count || 0;
    const notUsefulCount = feedbackStats.find(item => item.satisfatorio === false)?.count || 0;
    const feedbackCtx = document.getElementById('feedbackChart')?.getContext('2d');
    if (feedbackCtx) {
        setChartInstance('feedbackChart', () => new Chart(feedbackCtx, {
            type: 'doughnut',
            data: {
                labels: ['Úteis', 'Não Úteis'],
                datasets: [{ data: [usefulCount, notUsefulCount], backgroundColor: ['#10B981', '#EF4444'], borderColor: chartBorderColor, borderWidth: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom' } } }
        }));
    }

    // Category Chart
    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
    if (categoryCtx) {
        setChartInstance('categoryChart', () => new Chart(categoryCtx, {
            type: 'bar',
            data: {
                labels: categoryStats.map(c => c.nome),
                datasets: [{ label: 'Documentos', data: categoryStats.map(c => c.documentCount), backgroundColor: 'rgba(59, 130, 246, 0.7)' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        }));
    }

    // Subcategory Chart
    const subcategoryCtx = document.getElementById('subcategoryChart')?.getContext('2d');
    if (subcategoryCtx) {
        setChartInstance('subcategoryChart', () => new Chart(subcategoryCtx, {
            type: 'bar',
            data: {
                labels: subcategoryStats.map(s => s.nome),
                datasets: [{ label: 'Documentos', data: subcategoryStats.map(s => s.documentCount), backgroundColor: 'rgba(249, 115, 22, 0.7)' }]
            },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }
        }));
    }
}

/**
 * Renderiza o gráfico de termos mais pesquisados e popula seu seletor de categoria.
 * @param {object} searchData - Dados de buscas por categoria.
 */
export function renderTopSearchesChart(searchData) {
    const ctx = document.getElementById('topSearchesChart');
    const selector = document.getElementById('category-search-selector');
    if (!ctx || !selector) return;

    const newSelector = selector.cloneNode(true);
    selector.parentNode.replaceChild(newSelector, selector);

    if (!searchData || searchData.length === 0) {
        ctx.parentElement.innerHTML = '<p class="text-center text-neutral-500 dark:text-neutral-400 mt-8">Não há dados de pesquisa para exibir.</p>';
        newSelector.innerHTML = '<option>Nenhuma categoria</option>';
        return;
    }

    newSelector.innerHTML = searchData.map(item => `<option value="${item.category}">${item.category}</option>`).join('');

    const updateChart = (categoryName) => {
        const categoryData = searchData.find(d => d.category === categoryName);
        if (!categoryData) return;

        setChartInstance('topSearchesChart', () => new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categoryData.searches.map(s => s.term),
                datasets: [{ label: 'Nº de Buscas', data: categoryData.searches.map(s => s.count), backgroundColor: 'rgba(99, 102, 241, 0.7)' }]
            },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        }));
    };

    newSelector.addEventListener('change', (e) => updateChart(e.target.value));
    if (searchData.length > 0) updateChart(searchData[0].category);
}

// --- Funções de Renderização de Listas e Layout (sem alterações) ---

export function renderConsultationList(container, consultations) {
    if (!container) return;
    container.innerHTML = !consultations || consultations.length === 0 ? '<p class="text-center text-neutral-500 dark:text-neutral-400 py-4">Nenhuma consulta encontrada.</p>' : '';
    if (!consultations || consultations.length === 0) return;

    consultations.forEach(item => {
        let feedbackHtml = `<span class="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">${ICONS.noFeedback} Sem Feedback</span>`;
        if (item.feedback) {
            feedbackHtml = item.feedback.satisfatorio
                ? `<span class="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">${ICONS.thumbUp} Satisfatório</span>`
                : `<span class="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">${ICONS.thumbDown} Insatisfatório</span>`;
        }
        const docFoundHtml = item.chatResposta?.documento_fonte
            ? `<span class="text-blue-600 dark:text-blue-400">Sim</span> <span class="text-xs text-neutral-500">(${item.chatResposta.documento_fonte.titulo})</span>`
            : '<span class="text-yellow-600 dark:text-yellow-400">Não</span>';

        const el = document.createElement('div');
        el.className = 'bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 p-3 rounded-md';
        el.innerHTML = `<p class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">"${item.texto_consulta}"</p><ul class="text-xs text-neutral-600 dark:text-neutral-300 mt-2 space-y-1.5"><li><strong>Doc. Encontrado:</strong> ${docFoundHtml}</li><li><strong>Feedback:</strong> ${feedbackHtml}</li><li><strong>Data:</strong> ${new Date(item.datahora_consulta).toLocaleString('pt-BR')}</li></ul>`;
        container.appendChild(el);
    });
}

export function renderDocumentsForReview(documents) {
    const container = document.getElementById('documents-for-review-list');
    if (!container) return;

    if (!documents || documents.length === 0) {
        container.innerHTML = '<p class="text-neutral-500 dark:text-neutral-400 py-4">Nenhum documento precisa de revisão. ✨</p>';
        return;
    }

    container.innerHTML = '';

    documents.forEach(doc => {
        const el = document.createElement('div');
        el.className = 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-3 rounded-md flex items-center justify-between';
        
        el.innerHTML = `
            <div class="flex-1">
                <p class="text-sm font-semibold text-yellow-800 dark:text-yellow-200">${doc.titulo}</p>
                <ul class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    <li><strong>Última Atualização:</strong> ${new Date(doc.updatedAt).toLocaleDateString('pt-BR')}</li>
                    <li><strong>Categoria:</strong> ${doc.subcategoria?.categoria?.nome || 'N/A'}</li>
                </ul>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
                <button data-action="view" data-id="${doc.id}" class="p-2 text-yellow-700 dark:text-yellow-200 hover:bg-yellow-200/60 dark:hover:bg-yellow-800/60 rounded-full" title="Visualizar Documento">
                    ${ICONS.eye}
                </button>
                <button data-action="edit" data-id="${doc.id}" class="p-2 text-yellow-700 dark:text-yellow-200 hover:bg-yellow-200/60 dark:hover:bg-yellow-800/60 rounded-full" title="Editar Documento">
                    ${ICONS.pencil}
                </button>
            </div>
        `;
        container.appendChild(el);
    });
}

export function renderPagination(data) {
    const container = document.getElementById('modal-pagination-controls');
    if (!container) return;
    const { currentPage, totalPages } = data;
    container.innerHTML = (totalPages > 0) ? `
        <button id="prev-page-btn" class="px-3 py-1 rounded-md bg-neutral-200 dark:text-white dark:bg-neutral-600 disabled:opacity-50 flex items-center gap-1" ${currentPage === 1 ? 'disabled' : ''}>${ICONS.arrowLeft} <span>Anterior</span></button>
        <span class="text-sm dark:text-neutral-300">Página ${currentPage} de ${totalPages}</span>
        <button id="next-page-btn" class="px-3 py-1 rounded-md bg-neutral-200 dark:text-white dark:bg-neutral-600 disabled:opacity-50 flex items-center gap-1" ${currentPage >= totalPages ? 'disabled' : ''}><span>Próxima</span> ${ICONS.arrowRight}</button>
    ` : '';
}

export function renderPageLayout() {
    const container = document.getElementById('analytics-content');
    if (!container) return;
    container.innerHTML = `
    <div class="p-4 md:p-6 space-y-8">
        <div>
            <div class="flex items-center gap-3 mb-2">
                <span class="text-brand-green">${ICONS.analytics}</span>
                <h3 class="text-2xl font-bold text-neutral-800 dark:text-white">Análise de Desempenho</h3>
            </div>
            <p class="text-neutral-600 dark:text-neutral-400 max-w-3xl">Monitore a eficácia da base de conhecimento, o feedback dos usuários e a distribuição de conteúdo para identificar pontos de melhoria.</p>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div class="lg:col-span-2 bg-white dark:bg-neutral-800/50 p-4 sm:p-6 rounded-lg shadow-sm flex flex-col"><h4 class="flex items-center gap-2 text-lg font-semibold text-neutral-800 dark:text-white mb-4 text-center mx-auto">${ICONS.feedback}<span>Utilidade dos Documentos</span></h4><div class="relative h-72 md:h-80 flex-grow"><canvas id="feedbackChart"></canvas></div></div>
            <div class="lg:col-span-3 bg-white dark:bg-neutral-800/50 p-4 sm:p-6 rounded-lg shadow-sm"><h4 class="flex items-center gap-2 text-lg font-semibold text-neutral-800 dark:text-white mb-4">${ICONS.distribution}<span>Distribuição de Documentos</span></h4><div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-4"><div class="relative h-80 md:h-96"><h5 class="text-md font-medium text-center text-neutral-700 dark:text-neutral-300 mb-2">Por Categoria</h5><canvas id="categoryChart"></canvas></div><div class="relative h-80 md:h-96"><h5 class="text-md font-medium text-center text-neutral-700 dark:text-neutral-300 mb-2">Por Subcategoria</h5><canvas id="subcategoryChart"></canvas></div></div></div>
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div class="bg-white dark:bg-neutral-800/50 p-4 sm:p-6 rounded-lg shadow-sm"><h4 class="flex items-center gap-2 text-lg font-semibold text-neutral-800 dark:text-white mb-2">${ICONS.list}<span>Últimas Consultas do Chatbot</span></h4><p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Análise de eficácia e feedback do usuário.</p><div id="latest-consultations-list" class="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin"></div><div class="mt-4 text-right"><button id="view-more-consultations-btn" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 ml-auto">${ICONS.search}<span>Ver Mais e Filtrar</span></button></div></div>
            <div class="bg-white dark:bg-neutral-800/50 p-4 sm:p-6 rounded-lg shadow-sm"><div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4"><h4 class="flex items-center gap-2 text-lg font-semibold text-neutral-800 dark:text-white">${ICONS.search}<span>Tópicos Mais Pesquisados por Categoria</span></h4><div><label for="category-search-selector" class="sr-only">Selecionar Categoria</label><select id="category-search-selector" class="w-full sm:w-64 p-2 border rounded-md dark:text-white bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600"></select></div></div><div class="relative h-96"><canvas id="topSearchesChart"></canvas></div></div>
        </div>
        <div class="bg-white dark:bg-neutral-800/50 p-4 sm:p-6 rounded-lg shadow-sm"><h4 class="flex items-center gap-2 text-lg font-semibold text-neutral-800 dark:text-white mb-2">${ICONS.review}<span>Documentos para Revisão</span></h4><p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Documentos não atualizados nos últimos 6 meses.</p><div id="documents-for-review-list" class="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin"></div></div>
    </div>
    <div id="consultations-modal" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center p-4 z-50"><div class="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-neutral-200 dark:border-neutral-700"><div class="p-4 border-b dark:border-neutral-700 flex justify-between items-center"><h3 class="text-lg font-semibold text-neutral-800 dark:text-white flex items-center gap-2">${ICONS.search}<span>Explorar Consultas</span></h3><button id="close-modal-btn" class="text-neutral-500 hover:text-neutral-800 dark:hover:text-white">${ICONS.close}</button></div><div class="p-4 border-b dark:border-neutral-700"><form id="consultation-filter-form" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"><div class="md:col-span-2 relative"><label for="filter-search-term" class="text-sm font-medium text-neutral-700 dark:text-white">Buscar por termo</label><span class="absolute bottom-2 left-2 text-neutral-400">${ICONS.search}</span><input type="text" id="filter-search-term" placeholder="ex: Bloqueio" class="mt-1 w-full pl-9 p-2 border rounded-md dark:text-white bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600"></div><div><label for="filter-feedback-status" class="text-sm font-medium text-neutral-700 dark:text-white">Feedback</label><select id="filter-feedback-status" class="mt-1 w-full p-2 border rounded-md dark:text-white bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600"><option value="">Todos</option><option value="satisfactory">Satisfatório</option><option value="unsatisfactory">Insatisfatório</option><option value="none">Sem Feedback</option></select></div><div><button type="submit" class="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">${ICONS.filter}<span>Filtrar</span></button></div></form></div><div id="modal-consultations-list" class="p-4 overflow-y-auto flex-grow space-y-3"></div><div id="modal-pagination-controls" class="p-4 border-t dark:border-neutral-700 flex justify-center items-center gap-4"></div></div></div>
    `;
}

export function showConsultationModal() {
    document.getElementById('consultations-modal')?.classList.remove('hidden');
    document.getElementById('consultations-modal')?.classList.add('flex');
}

export function hideConsultationModal() {
    document.getElementById('consultations-modal')?.classList.add('hidden');
    document.getElementById('consultations-modal')?.classList.remove('flex');
}
