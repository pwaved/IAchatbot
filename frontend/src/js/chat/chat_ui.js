// src/js/chat/chat_ui.js

/**
 * @file Gerencia todas as manipulações diretas do DOM para o chat.
 * Funções para criar mensagens, mostrar/ocultar indicadores, popular selects, etc.
 */

import { state } from './chat_state.js';
import ICONS from '../../utils/icons.js';

/**
 * Encontra e armazena as referências dos elementos do DOM no estado.
 * @returns {boolean} Retorna `true` se os elementos essenciais forem encontrados.
 */
export function initElements() {
    state.elements.chatMessages = document.getElementById('chat-messages');
    if (!state.elements.chatMessages) return false;

    state.elements.chatInput = document.getElementById('chat-input');
    state.elements.sendButton = document.getElementById('send-button');
    state.elements.faqContainer = document.getElementById('faq-container');
    state.elements.categorySelect = document.getElementById('category-select');
    state.elements.subcategorySelect = document.getElementById('subcategory-select');
    return true;
}

/**
 * Cria o elemento HTML para uma mensagem no chat.
 * @param {string} message - O texto da mensagem.
 * @param {object} options - Opções como isUser, sources, context.
 * @returns {HTMLElement} O elemento da mensagem.
 */
export function createMessageElement(message, { isUser, sources = [], context = {} }) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `w-full flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`;

    let messageHTML = '';

    if (isUser) {
        messageHTML = `
            <div class="bg-brand-green text-white rounded-2xl rounded-br-lg px-5 py-3 max-w-lg shadow-md">
                <p class="text-sm">${message}</p>
            </div>`;
    } else {
        const sourcesHTML = sources && sources.length > 0 ? `
            <div class="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-600/50">
                <h4 class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">FONTES:</h4>
                <ul class="space-y-1">
                    ${sources.map(source => `
                        <li class="text-xs text-brand-darkgreen dark:text-emerald-400">
                            📄 ${source.titulo}
                        </li>
                    `).join('')}
                </ul>
            </div>` : '';

        const feedbackButtonsHTML = context.consultaId ? `
            <div class="border-t border-neutral-200 dark:border-neutral-600 pt-3 mt-3">
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Isso foi útil?</p>
                <div class="flex space-x-2">
                    <button data-action="helpful" data-consulta-id="${context.consultaId}" class="flex items-center space-x-1.5 text-green-500 bg-white dark:bg-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-500 border border-neutral-300 dark:border-neutral-500 dark:text-green-300 rounded-full px-3 py-1 text-xs font-medium transition-colors">
                        ${ICONS.thumbUp} <span>Sim</span>
                    </button>
                    <button data-action="not-helpful" data-consulta-id="${context.consultaId}" class="flex items-center space-x-1.5 text-red-500 bg-white dark:bg-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-500 border border-neutral-300 dark:border-neutral-500 dark:text-red-300 rounded-full px-3 py-1 text-xs font-medium transition-colors">
                        ${ICONS.thumbDown} <span>Não</span>
                    </button>
                </div>
            </div>` : '';

        messageHTML = `
            <div class="flex items-start space-x-3">
                <div class="bg-white dark:bg-gray-700/80 rounded-full self-start mt-4 shadow-sm">
                    <img src="/assets/favicon-32x32.png" alt="icon chatbot" class="rounded-full">
                </div>
                <div class="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-lg p-4 max-w-lg shadow-md">
                    <div class="text-sm text-neutral-800 dark:text-neutral-100">${message}</div>
                    ${sourcesHTML} 
                    ${feedbackButtonsHTML}
                </div>
            </div>`;
    }

    messageWrapper.innerHTML = messageHTML;
    return messageWrapper;
}


/**
 * Adiciona uma mensagem ao contêiner de chat e rola para o final.
 * @param {string} message - O texto da mensagem.
 * @param {object} options - Opções para createMessageElement.
 */
export function addMessageToChat(message, options) {
    const messageElement = createMessageElement(message, options);
    state.elements.chatMessages.appendChild(messageElement);
    state.elements.chatMessages.scrollTop = state.elements.chatMessages.scrollHeight;
}

/**
 * Habilita ou desabilita os campos de entrada do chat.
 * @param {boolean} enable - True para habilitar, false para desabilitar.
 */
export function enableChat(enable) {
    const { chatInput, sendButton } = state.elements;
    if (!chatInput || !sendButton) return;
    
    chatInput.disabled = !enable;
    sendButton.disabled = !enable;
    chatInput.placeholder = enable ? 'Digite sua mensagem...' : 'Faça login para enviar uma mensagem.';
}

/**
 * Mostra ou oculta o indicador de "digitando".
 * @param {boolean} show - True para mostrar, false para ocultar.
 */
export function showTypingIndicator(show) {
    if (show) {
        if (!state.elements.typingIndicator) {
            const indicatorElement = createMessageElement(`<div class="typing-dots"><span></span><span></span><span></span></div>`, { isUser: false });
            indicatorElement.id = 'typing-indicator';
            state.elements.typingIndicator = indicatorElement;
            state.elements.chatMessages.appendChild(indicatorElement);
            state.elements.chatMessages.scrollTop = state.elements.chatMessages.scrollHeight;
        }
    } else {
        if (state.elements.typingIndicator) {
            state.elements.typingIndicator.remove();
            state.elements.typingIndicator = null;
        }
    }
}

/**
 * Atualiza a UI para mostrar a mensagem de "Obrigado pelo feedback".
 * @param {HTMLElement} button - O botão de feedback que foi clicado.
 */
export function showFeedbackThanks(button) {
    const feedbackContainer = button.closest('.border-t');
    if (feedbackContainer) {
        feedbackContainer.innerHTML = `<p class="text-xs text-neutral-500 dark:text-neutral-400">Obrigado pelo seu feedback!</p>`;
    }
}

/**
 * Popula o contêiner de FAQ com as perguntas fornecidas.
 * @param {string[]} faqs - Um array de perguntas.
 * @param {function} clickHandler - A função a ser chamada quando um botão de FAQ é clicado.
 */
export function populateFaqUI(faqs, clickHandler) {
    const { faqContainer } = state.elements;
    if (!faqContainer) return;
    
    faqContainer.innerHTML = '';
    if (!faqs || faqs.length === 0) {
        faqContainer.innerHTML = '<p class="text-xs text-center text-neutral-500 dark:text-neutral-400 p-2">Nenhuma sugestão no momento.</p>';
        return;
    }

    faqs.forEach(faq => {
        const button = document.createElement('button');
        button.className = 'w-full text-left text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-brand-green dark:hover:text-brand-green transition-colors p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700/50';
        button.textContent = faq;
        button.onclick = () => clickHandler(faq);
        faqContainer.appendChild(button);
    });
}

/**
 * Exibe uma mensagem de erro no contêiner de FAQ.
 */
export function showFaqError() {
    state.elements.faqContainer.innerHTML = '<p class="text-xs text-center text-red-500 dark:text-red-400 p-2">Não foi possível carregar as sugestões.</p>';
}

/**
 * Popula o select de categorias.
 */
export function populateCategoriesUI() {
    const { categorySelect } = state.elements;
    categorySelect.innerHTML = '<option value="">Todas as Categorias</option>';
    state.allCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.nome;
        categorySelect.appendChild(option);
    });
}

/**
 * Popula o select de subcategorias com base na categoria selecionada.
 */
export function updateSubcategoriesUI() {
    const { subcategorySelect } = state.elements;
    subcategorySelect.innerHTML = '<option value="">Todas as Subcategorias</option>';
    
    if (!state.selectedCategoryId) {
        subcategorySelect.disabled = true;
        return;
    }

    const selectedCategory = state.allCategories.find(c => c.id === state.selectedCategoryId);
    if (selectedCategory && selectedCategory.subcategorias?.length > 0) {
        selectedCategory.subcategorias.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub.id;
            option.textContent = sub.nome;
            subcategorySelect.appendChild(option);
        });
        subcategorySelect.disabled = false;
    } else {
        subcategorySelect.disabled = true;
    }
}

/**
 * Insere a pergunta no campo de input.
 * @param {string} question 
 */
export function insertQuestionIntoInput(question) {
    if (state.elements.chatInput) {
        state.elements.chatInput.value = question;
        state.elements.chatInput.focus();
    }
}