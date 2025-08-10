// src/js/apiChat.js

import { API_BASE_URL, getFetchOptions, handleResponse } from './apiUtils.js';

export async function startSession() {
    const options = getFetchOptions('POST');
    const response = await fetch(`${API_BASE_URL}/sessoes`, options);
    return handleResponse(response);
}

export async function postMessage(sessionId, requestBody) {
    const options = getFetchOptions('POST', requestBody);
    const response = await fetch(`${API_BASE_URL}/sessoes/${sessionId}/consultas`, options);
    return handleResponse(response);
}

export async function postFeedback(consultaId, isSatisfactory) {
    const body = { satisfatorio: isSatisfactory };
    const options = getFetchOptions('POST', body);
    const response = await fetch(`${API_BASE_URL}/consultas/${consultaId}/feedbacks`, options);
    return handleResponse(response);
}

export async function postNewPendingTopic(consultaId) {
    const body = { consulta_id: consultaId };
    const options = getFetchOptions('POST', body);
    const response = await fetch(`${API_BASE_URL}/assuntos-pendentes`, options);
    return handleResponse(response);
}

export async function getChatHistory(sessionId, page) {
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/sessoes/${sessionId}/consultas?page=${page}`, options);
    return handleResponse(response);
}

export async function getPopularQuestions() {
    // Rota pública, mas usamos getFetchOptions por consistência.
    const options = getFetchOptions('GET');
    const response = await fetch(`${API_BASE_URL}/faq/popular`, options);
    return handleResponse(response);
}
