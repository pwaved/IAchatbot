import themeManager from '../../utils/theme.js';
import { getDocuments, getCategories, getDocumentById, downloadDocumentAttachment } from '../../api/apiDocumentos.js';
import * as state from './colaborador_state.js';
import * as ui from './colaborador_ui.js';
import * as eventos from './colaborador_eventos.js';
import { triggerBrowserDownload } from '../../utils/download.js';
import * as authState from '../auth/auth_state.js';


async function loadInitialData() {
    try {
        ui.showLoadingState();
        const [categories, documents] = await Promise.all([
            getCategories(),
            getDocuments()
        ]);
        state.setAllCategories(categories);
        state.setAllDocuments(documents);
        ui.renderFilterButtons();
        filterAndRender();
    } catch (error) {
        console.error('Falha ao carregar dados iniciais:', error);
        ui.showLoadingError();
    }
}

export function filterAndRender() {
    const allDocs = state.getDocuments();
    const { category, search } = state.getCurrentFilters();
    const currentPage = state.getCurrentPage();
    const documentsPerPage = state.getDocumentsPerPage();
    const searchTermLower = search.toLowerCase();

    const filteredDocs = allDocs.filter(doc => {
        const matchesCategory = !category || (doc.subcategoria?.categoria?.id)?.toString() === category;
        const matchesSearch = searchTermLower === '' ||
            doc.titulo.toLowerCase().includes(searchTermLower) ||
            doc.conteudo.toLowerCase().includes(searchTermLower) ||
            (doc.PalavraChaves || []).some(kw => kw.nome.toLowerCase().includes(searchTermLower));
        return matchesCategory && matchesSearch;
    });

    const startIndex = (currentPage - 1) * documentsPerPage;
    const paginatedDocs = filteredDocs.slice(startIndex, startIndex + documentsPerPage);

    ui.renderCards(paginatedDocs);
    ui.renderPagination(filteredDocs.length);
    ui.updateFilterButtonsState();
}

export async function showDocumentDetails(documentId) {
    try {
        const doc = await getDocumentById(documentId);
        ui.showDocumentModal(doc);
    } catch (error) {
        ui.showErrorModal('Erro ao Visualizar', 'Não foi possível carregar os detalhes do documento.');
    }
}

/**
 * Inicia o download de um anexo.
 * A verificação de autenticação agora usa o authState.isLoggedIn().
 */
export async function downloadAttachment(documentId, fileName) {

    if (!authState.isLoggedIn()) {
        ui.showErrorModal('Acesso Negado', 'Você precisa estar logado para baixar arquivos.');
        return;
    }
    try {
        const blob = await downloadDocumentAttachment(documentId);
        triggerBrowserDownload(blob, fileName);
    } catch (error) {
        ui.showErrorModal('Erro no Download', `Não foi possível baixar o arquivo: ${error.message}`);
    }
}

/**
 *  Verifica as permissões de forma assíncrona.
 * Garante que a sessão foi checada com o backend antes de validar o acesso.
 */
async function checkPermissions() {
    // Se o estado do usuário ainda não foi carregado, aguarda a verificação da sessão.
    if (!authState.isLoggedIn()) {
        await authState.checkSession();
    }

    // Agora, com o estado potencialmente atualizado, faz a verificação.
    if (!authState.isColaborador() && !authState.isAdmin()) {
        window.location.href = '/'; // Redireciona se não tiver permissão
        throw new Error('AUTH_REDIRECT: Acesso não autorizado.');
    }
}

/**
 *  Função de inicialização agora é assíncrona.
 */
export function init() {
    return new Promise(async (resolve, reject) => {
        try {
            await checkPermissions();
            
            ui.buildLayout(); 
            eventos.initializeEventListeners();
            
            await loadInitialData();

            resolve();
        } catch (error) {
            reject(error);
        }
    });
}