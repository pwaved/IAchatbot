import Modal from '../../componentes/modal.js';
import { ICONS } from '../../utils/icons.js';
import { handleApiError, showSuccessModal } from '../../utils/error-handle.js';
import { 
    getDocumentById, 
    getAssuntosPendentes, 
    getAssuntoPendenteById, 
    updateDocument, 
    createDocument, 
    deleteDocument, 
    removeAttachment,
    updateAssuntoPendenteStatus 
} from '../../api/apiDocumentos.js';
import { getState, setState } from './documento_state.js'; 
import { loadAndRenderDocuments } from './documento_main.js'; 

/**
 * Formata uma string de data para o formato 'dd/mm/yyyy'.
 * @param {string} dateString - A string da data.
 * @returns {string} A data formatada ou uma string de fallback.
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data inválida';
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) {
        return 'Erro de data';
    }
}

/**
 * Orquestra a criação de um documento a partir de um tópico pendente.
 * @param {string} topicId - O ID do tópico pendente.
 */
async function handleCreateDocumentFromTopic(topicId) {
    try {
        const topicData = await getAssuntoPendenteById(topicId);
        const initialData = {
            titulo: topicData.texto_assunto,
            conteudo: `O usuário perguntou: "${topicData.texto_assunto}".\n\nPor favor, complete o conteúdo do documento com informações relevantes.`,
            categoria_id: topicData.categoria_id,
            subcategoria_id: topicData.subcategoria_id
        };
        showDocumentFormModal(null, initialData);
    } catch (error) {
        handleApiError(error);
    }
}


/**
 * Exibe o modal com os detalhes de um documento específico.
 * @param {string} documentId - O ID do documento a ser visualizado.
 */
export async function showViewDocumentModal(documentId) {
    try {
        const doc = await getDocumentById(documentId);
        const macro = doc.subcategoria?.categoria || null;
        const micro = doc.subcategoria || null;

        const anexoArquivoHtml = doc.anexo_nome ? `
            <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Arquivo Anexado:</h4>
                <a href="#" data-action="download" data-id="${doc.id}" data-name="${doc.anexo_nome}" class="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <svg class="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                    <span class="truncate">${doc.anexo_nome}</span>
                </a>
            </div>` : '';

        const modalContent = `
            <div class="max-h-[65vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-500">
                <div class="space-y-4">
                    <h3 class="text-xl font-semibold text-neutral-800 dark:text-white">${doc.titulo}</h3>
                    ${macro ? `<div class="flex flex-wrap gap-2"><span class="px-2 py-1 rounded text-sm text-white" style="background-color: ${macro.cor}">${macro.nome}</span>${micro ? `<span class="px-2 py-1 rounded text-sm text-white" style="background-color: ${micro.cor}">${micro.nome}</span>` : ''}</div>` : ''}
                    <div class="dark:text-neutral-300 text-neutral-800 break-words">${doc.conteudo.replace(/\n/g, '<br>')}</div>
                    <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Palavras-chave:</h4>
                        <div class="flex flex-wrap gap-2">${(doc.PalavraChaves && doc.PalavraChaves.length > 0) ? doc.PalavraChaves.map(p => `<span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">${p.nome}</span>`).join('') : '<span class="text-xs text-neutral-500">Nenhuma palavra-chave.</span>'}</div>
                    </div>
                    ${anexoArquivoHtml}
                    <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Adicionado em: ${formatDate(doc.dataInclusao)}</span><br>
                        <span>Última atualização: ${formatDate(doc.updatedAt)}</span><br>
                        <span>ID do Documento: ${doc.id}</span>
                    </div>
                </div>
            </div>`;

        const viewModal = new Modal({
            id: 'view-document-modal',
            title: 'Detalhes do Documento',
            content: modalContent,
            footerButtons: [
                { text: 'Fechar', type: 'secondary', onClick: () => viewModal.destroy() },
                { text: 'Editar', type: 'primary', onClick: () => { viewModal.destroy(); showDocumentFormModal(documentId); } }
            ]
        });
        viewModal.show();
        setState({ activeModalInstance: viewModal });
    } catch (error) {
        handleApiError(error);
    }
}

/**
 * Exibe o modal de formulário para adicionar ou editar um documento.
 * @param {string|null} documentId - O ID do documento para editar, ou null para criar um novo.
 * @param {object} initialData - Dados iniciais para pré-popular o formulário.
 */
export async function showDocumentFormModal(documentId = null, initialData = {}) {
    const isEditing = documentId !== null;
    const modalTitle = isEditing ? 'Editar Documento' : 'Adicionar Novo Documento';
    let documentData = {};
    const { allCategories } = getState();

    try {
        if (isEditing) {
            documentData = await getDocumentById(documentId);
        } else {
            documentData = { ...initialData };
        }
        
        const initialSelectedCategoryId = documentData.subcategoria?.categoria?.id || documentData.categoria_id;
        const initialSelectedSubcategoryId = documentData.subcategoria?.id || documentData.subcategoria_id;

        const categoriesOptions = Object.values(allCategories).map(category => {
            const isSelected = initialSelectedCategoryId === category.id;
            return `<option value="${category.id}" ${isSelected ? 'selected' : ''}>${category.nome}</option>`;
        }).join('');

        let subcategoriesOptions = '<option value="">Selecione uma subcategoria</option>';
        if (initialSelectedCategoryId && allCategories[initialSelectedCategoryId]) {
            const selectedCategory = allCategories[initialSelectedCategoryId];
            subcategoriesOptions += Object.values(selectedCategory.subcategorias).map(sub => {
                const isSelected = initialSelectedSubcategoryId === sub.id;
                return `<option value="${sub.id}" ${isSelected ? 'selected' : ''}>${sub.nome}</option>`;
            }).join('');
        }
        
        const anexoAtualHtml = (isEditing && documentData.anexo_nome) ? `
            <div id="anexo-info-container" class="mt-2 p-3 border rounded-lg bg-neutral-100 dark:bg-neutral-700/50 dark:border-neutral-600">
                <div class="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300">
                    <div>
                        <p><strong>Arquivo atual:</strong> ${documentData.anexo_nome}</p>
                        <p class="text-xs italic mt-1">Para substituir, apenas escolha um novo arquivo.</p>
                    </div>
                    <button type="button" id="remove-attachment-btn" data-document-id="${documentId}" class="text-xs font-semibold text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400">Remover</button>
                </div>
            </div>` : '';

        const formContentHTML = `
            <div class="max-h-[70vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-500">
                <form id="document-form" class="space-y-4" novalidate>
                    <input type="hidden" name="id" value="${documentData.id || ''}">
                    <div>
                        <label for="document-title" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Título</label>
                        <input id="document-title" name="titulo" type="text" value="${documentData.titulo || ''}" placeholder="Título do Documento" class="w-full dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-3" required>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="document-category" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Categoria</label>
                            <select id="document-category" name="categoriaId" class="w-full dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-3" required>
                                <option value="">Selecione uma categoria</option>
                                ${categoriesOptions}
                            </select>
                        </div>
                        <div>
                            <label for="document-subcategory" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Subcategoria</label>
                            <select id="document-subcategory" name="subcategoriaId" class="w-full dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-3" ${!initialSelectedCategoryId ? 'disabled' : ''}>
                                ${subcategoriesOptions}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label for="document-content" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Conteúdo</label>
                        <textarea id="document-content" name="conteudo" rows="8" placeholder="Corpo do documento..." class="w-full dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-3" required>${documentData.conteudo || ''}</textarea>
                    </div>
                    <div>
                        <label for="document-keywords" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Palavras-chave (separadas por vírgula)</label>
                        <input id="document-keywords" name="palavras" type="text" value="${(documentData.PalavraChaves || []).map(p => p.nome).join(', ')}" placeholder="ex: financeiro, imposto, folha de pagamento" class="w-full dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-3">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Anexar Arquivo</label>
                        ${anexoAtualHtml}
                        <input id="document-attachment-file" name="anexoArquivo" type="file" class="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-neutral-400 dark:file:bg-blue-900/50 dark:file:text-blue-300 mt-2">
                    </div>
                    <p id="document-error-message" class="text-sm text-red-500"></p>
                </form>
            </div>`;

        const formModal = new Modal({
            id: 'document-form-modal',
            title: modalTitle,
            content: formContentHTML,
            footerButtons: [
                { text: 'Cancelar', type: 'secondary', onClick: () => formModal.destroy() },
                { text: 'Salvar', type: 'primary', onClick: () => formModal.modalElement.querySelector('#document-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })) }
            ]
        });
        
        formModal.show();
        setState({ activeModalInstance: formModal });

        const form = formModal.modalElement.querySelector('#document-form');
        const categorySelect = form.querySelector('#document-category');
        const subcategorySelect = form.querySelector('#document-subcategory');
        
        categorySelect.addEventListener('change', () => {
            const selectedCategoryId = categorySelect.value;
            const { allCategories } = getState();
            subcategorySelect.innerHTML = '<option value="">Selecione uma subcategoria</option>';
            if (selectedCategoryId && allCategories[selectedCategoryId]) {
                const selectedCategory = allCategories[selectedCategoryId];
                Object.values(selectedCategory.subcategorias).forEach(sub => {
                    const option = document.createElement('option');
                    option.value = sub.id;
                    option.textContent = sub.nome;
                    subcategorySelect.appendChild(option);
                });
                subcategorySelect.disabled = false;
            } else {
                subcategorySelect.disabled = true;
            }
        });

        const removeAttachmentBtn = form.querySelector('#remove-attachment-btn');
        if (removeAttachmentBtn) {
            removeAttachmentBtn.addEventListener('click', () => {
                const docId = removeAttachmentBtn.dataset.documentId;
                const confirmModal = new Modal({
                    id: 'confirm-remove-attach-modal',
                    title: 'Confirmar Remoção',
                    content: `<p class="text-neutral-700 dark:text-neutral-300">Tem certeza que deseja remover o anexo? Esta ação não pode ser desfeita.</p>`,
                    footerButtons: [
                        { text: 'Cancelar', type: 'secondary', onClick: () => confirmModal.destroy() },
                        { text: 'Remover', type: 'danger', onClick: async () => {
                            try {
                                confirmModal.destroy();
                                await removeAttachment(docId);
                                const anexoContainer = form.querySelector('#anexo-info-container');
                                if (anexoContainer) anexoContainer.remove();
                                showSuccessModal('Anexo removido com sucesso!');
                                loadAndRenderDocuments(); // Recarrega para garantir consistência
                            } catch (error) {
                                handleApiError(error);
                            }
                        }}
                    ]
                });
                confirmModal.show();
            });
        }

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const errorMessageElement = form.querySelector('#document-error-message');
            errorMessageElement.textContent = '';

            const id = form.querySelector('input[name="id"]').value;
            const titulo = form.querySelector('#document-title').value.trim();
            const categoriaId = form.querySelector('#document-category').value;
            const conteudo = form.querySelector('#document-content').value.trim();

            if (!titulo || !categoriaId || !conteudo) {
                errorMessageElement.textContent = 'Por favor, preencha todos os campos obrigatórios (Título, Categoria, Conteúdo).';
                return;
            }

            const formData = new FormData();
            formData.append('titulo', titulo);
            formData.append('conteudo', conteudo);
            formData.append('subcategoriaId', form.querySelector('#document-subcategory').value || '');
            
            const keywordNames = form.querySelector('#document-keywords').value.split(',').map(p => p.trim()).filter(p => p !== '');
            formData.append('keywordNames', JSON.stringify(keywordNames));

            const fileInput = form.querySelector('#document-attachment-file');
            if (fileInput.files.length > 0) {
                formData.append('anexoArquivo', fileInput.files[0]);
            }

            try {
                if (isEditing) {
                    await updateDocument(id, formData);
                    showSuccessModal('Documento atualizado com sucesso!');
                } else {
                    await createDocument(formData);
                    showSuccessModal('Documento adicionado com sucesso!');
                }
                formModal.destroy();
                await loadAndRenderDocuments();
            } catch (error) {
                errorMessageElement.textContent = error.data?.error || error.message || 'Erro desconhecido.';
                handleApiError(error);
            }
        });

    } catch (error) {
        handleApiError(error);
    }
}

/**
 * Exibe o modal de confirmação para deletar um documento.
 * @param {string} documentId - O ID do documento a ser deletado.
 * @param {string} documentTitle - O título do documento para exibição.
 */
export function showDeleteConfirmationModal(documentId, documentTitle) {
    const deleteModal = new Modal({
        id: 'delete-confirm-modal',
        title: 'Confirmar Exclusão',
        content: `<p class="text-neutral-700 dark:text-neutral-300">Tem certeza que deseja remover o documento "<strong class="font-semibold">${documentTitle}</strong>"? Esta ação não pode ser desfeita.</p>`,
        footerButtons: [
            { text: 'Cancelar', type: 'secondary', onClick: () => deleteModal.destroy() },
            {
                text: 'Remover', type: 'danger', onClick: async () => {
                    try {
                        await deleteDocument(documentId);
                        showSuccessModal('Documento removido com sucesso!');
                        deleteModal.destroy();
                        await loadAndRenderDocuments();
                    } catch (error) {
                        handleApiError(error);
                    }
                }
            }
        ]
    });
    deleteModal.show();
    setState({ activeModalInstance: deleteModal });
}

/**
 * Exibe o modal com a lista de assuntos pendentes.
 */
export async function showPendingTopicsModal() {
    const { activeModalInstance } = getState();
    if (activeModalInstance) activeModalInstance.destroy();

    try {
        const topics = await getAssuntosPendentes();
        const modalContent = topics.length === 0
            ? '<p class="text-neutral-500 dark:text-neutral-400">Nenhum assunto pendente no momento. ✨</p>'
            : `<div class="max-h-[60vh] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-500"><ul id="pending-topics-list" class="space-y-3">${topics.map(topic => `<li class="p-3 bg-neutral-100 dark:bg-neutral-700/50 rounded-lg flex justify-between items-center" data-topic-id="${topic.id}"><div class="flex-grow"><p class="font-medium text-neutral-800 dark:text-neutral-200">${topic.texto_assunto}</p><p class="text-xs text-neutral-500 dark:text-neutral-400">Sugerido em: ${formatDate(topic.datahora_sugestao)}</p></div><div class="flex-shrink-0 ml-4 space-x-2"><button title="Criar Documento a partir deste Assunto" data-action="create-from-topic" data-topic-id="${topic.id}" class="p-2 text-brand-green hover:bg-green-100 dark:hover:bg-neutral-600 rounded-full">${ICONS.documentAdd}</button><button title="Marcar como Resolvido" data-action="resolve-topic" data-topic-id="${topic.id}" class="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-neutral-600 rounded-full">${ICONS.check}</button></div></li>`).join('')}</ul></div>`;
        
        const pendingModal = new Modal({
            id: 'pending-topics-modal',
            title: 'Assuntos Pendentes para Documentação',
            content: modalContent,
            footerButtons: [{ text: 'Fechar', type: 'secondary', onClick: () => pendingModal.destroy() }]
        });
        
        pendingModal.show();
        setState({ activeModalInstance: pendingModal });

        const list = pendingModal.modalElement.querySelector('#pending-topics-list');
        if (list) {
            list.addEventListener('click', async (event) => {
                const button = event.target.closest('button');
                if (!button) return;

                const action = button.dataset.action;
                const topicId = button.dataset.topicId;

                if (action === 'create-from-topic') {
                    pendingModal.destroy();
                    handleCreateDocumentFromTopic(topicId);
                }
                
                if (action === 'resolve-topic') {
                    try {
                        await updateAssuntoPendenteStatus(topicId, 'Resolvido' ); 
                        button.closest('li').style.display = 'none';
                        showSuccessModal('Assunto marcado como resolvido!');
                    } catch (error) {
                        handleApiError(error);
                    }
                }
            });
        }
    } catch (error) {
        handleApiError(error);
    }
}
