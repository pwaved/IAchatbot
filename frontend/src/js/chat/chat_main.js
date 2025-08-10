// src/js/chat/chat_main.js

/**
 * @file Ponto de entrada  principal do módulo de chat.
 * Expõe os métodos `init` e `setAuthState`.
 */

import { state } from './chat_state.js';
import * as ui from './chat_ui.js';
import * as events from './chat_events.js';
import { startSession, getPopularQuestions } from '../../api/apiChat.js';
import { getCategories } from '../../api/apiCategoria.js';
import { ICONS, renderIcons } from '../../utils/icons.js';

/**
 * Inicia uma nova sessão de chat.
 */
async function startChatSession() {
    if (state.isSessionStarting) return; // Se já está iniciando uma sessão, para aqui.
    state.isSessionStarting = true; // Ativa a trava.

    ui.showTypingIndicator(true);
    try {
        const session = await startSession();
        state.currentSessionId = session.id;
        ui.addMessageToChat("Olá! Sou o assistente virtual Quero-Quero. Como posso ajudar?", { isUser: false });
    } catch (error) {
        ui.addMessageToChat('Desculpe, não foi possível conectar ao nosso assistente. Tente recarregar a página.', { isUser: false });
    } finally {
        ui.showTypingIndicator(false);
        state.isSessionStarting = false; //  Libera a trava no final, seja sucesso ou erro.
    }
}

/**
 * Busca e popula as categorias.
 */
async function populateCategories() {
    try {
        state.allCategories = await getCategories();
        ui.populateCategoriesUI();
        ui.updateSubcategoriesUI(); // Garante que o select de subcategorias inicie desabilitado
    } catch (error) {
        state.elements.categorySelect.innerHTML = '<option value="">Faça login para selecionar</option>';
    }
}

/**
 * Busca e popula as perguntas frequentes.
 * @param {function} faqClickHandler - A função para lidar com o clique em uma FAQ.
 */
async function populateFaq(faqClickHandler) {
    try {
        const faqs = await getPopularQuestions();
        ui.populateFaqUI(faqs, faqClickHandler);
    } catch (error) {
        ui.showFaqError();
    }
}



const chatController = {
    isInitialized: false, // Inicia como false
    
    async init() {
        if (!ui.initElements()) {
            return;
        }
        renderIcons({
            'user-menu-chevron-icon': ICONS.chevronDown,
            'close-faq-icon': ICONS.close,
            'faq-toggle-icon': ICONS.list,
            'chat-header-icon': ICONS.bot,
            'send-button-icon': ICONS.send,
            'close-modal-icon': ICONS.close
        });
        events.setupEventListeners(); // Configura eventos de UI
        ui.enableChat(false);         // Começa desabilitado
        this.isInitialized = true;    // Marca como pronto
    },
    setAuthState(isLoggedIn) {
        if (!this.isInitialized) return;

        ui.enableChat(isLoggedIn);

        if (isLoggedIn) {
            // Apenas carrega os dados quando o login é confirmado
            populateCategories();
            populateFaq(events.getFaqClickHandler());
            state.elements.chatMessages.innerHTML = '';
            startChatSession();
        } else {
            // Lógica de logout
            state.currentSessionId = null;
            state.isSessionStarting = false;
        }
    }
};

export default chatController;