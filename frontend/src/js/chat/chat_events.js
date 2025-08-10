// src/js/chat/chat_events.js

/**
 * @file Gerencia todos os eventos do chat e suas lógicas correspondentes.
 * Conecta as ações do usuário (clicks, envios) com as chamadas de API e atualizações da UI.
 */

import { state } from './chat_state.js';
import * as ui from './chat_ui.js';
import { postMessage, postFeedback } from '../../api/apiChat.js';

let faqClickHandler;

/**
 * Lida com o envio de uma mensagem.
 */
async function handleSendMessage() {
    const messageText = state.elements.chatInput.value.trim();
    if (!messageText || !state.currentSessionId) return;

    ui.addMessageToChat(messageText, { isUser: true });
    state.elements.chatInput.value = '';
    ui.showTypingIndicator(true);

    try {
        const requestBody = {
            texto_consulta: messageText,
            categoria_id: state.selectedCategoryId,
            subcategoria_id: state.selectedSubcategoryId
        };
        const data = await postMessage(state.currentSessionId, requestBody);
        ui.addMessageToChat(data.resposta.texto_resposta, {
            isUser: false,
            sources: data.fontes,
            context: {
                consultaId: data.consulta?.id,
                sugestao_pendente: data.resposta?.sugestao_pendente,
            }
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        ui.addMessageToChat('Ocorreu um erro ao buscar sua resposta. Por favor, tente novamente.', { isUser: false });
    } finally {
        ui.showTypingIndicator(false);
    }
}

/**
 * Lida com o clique no botão de feedback.
 * @param {Event} event
 */
async function handleFeedbackClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    if (action === 'helpful' || action === 'not-helpful') {
        const consultaId = button.dataset.consultaId;
        const isHelpful = (action === 'helpful');
        
        // Atualiza a UI imediatamente
        ui.showFeedbackThanks(button);
        
        // Envia o feedback em segundo plano
        try {
            await postFeedback(consultaId, isHelpful);
        } catch (error) {
            console.error('Erro ao enviar feedback em segundo plano:', error);
        }
    }
    // Lógica para 'suggest-topic' pode ser adicionada aqui
}

/**
 * Lida com a mudança de categoria.
 */
function handleCategoryChange() {
    const categoryId = state.elements.categorySelect.value;
    state.selectedCategoryId = categoryId ? parseInt(categoryId, 10) : null;
    state.selectedSubcategoryId = null; // Reseta a subcategoria
    ui.updateSubcategoriesUI();
}

/**
 * Lida com a mudança de subcategoria.
 */
function handleSubcategoryChange() {
    const subId = state.elements.subcategorySelect.value;
    state.selectedSubcategoryId = subId ? parseInt(subId, 10) : null;
}

/**
 * Lida com o clique em uma pergunta do FAQ.
 * @param {string} question 
 */
function handleFaqClick(question) {
    ui.insertQuestionIntoInput(question);
    handleSendMessage(); // Envia a pergunta automaticamente
}

/**
 * Configura todos os event listeners do chat.
 */
export function setupEventListeners() {
    const { sendButton, chatInput, categorySelect, subcategorySelect, chatMessages } = state.elements;
    
    faqClickHandler = handleFaqClick;
    sendButton.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSendMessage();
        }
    });

    categorySelect.addEventListener('change', handleCategoryChange);
    subcategorySelect.addEventListener('change', handleSubcategoryChange);
    chatMessages.addEventListener('click', handleFeedbackClick);
    
    
}
export function getFaqClickHandler() {
    return faqClickHandler;
}