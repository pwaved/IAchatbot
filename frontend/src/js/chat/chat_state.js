// src/js/chat/chat_state.js

/**
 * @file Contém o estado centralizado do módulo de chat.
 * Inclui referências de elementos do DOM, IDs de sessão, categorias e outros dados dinâmicos.
 */

export const state = {
    currentSessionId: null,
    isInitialized: false,
    allCategories: [],
    isSessionStarting: false,
    selectedCategoryId: null,
    selectedSubcategoryId: null,
    
    // Referências para os elementos do DOM
    elements: {
        chatMessages: null,
        chatInput: null,
        sendButton: null,
        typingIndicator: null, // Referência para o indicador de digitação
        faqContainer: null,
        categorySelect: null,
        subcategorySelect: null,
    },
};