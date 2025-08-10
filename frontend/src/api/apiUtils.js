// frontend/src/api/apiUtils.js
export const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Opções padrão para as chamadas fetch que precisam de autenticação.
 * A opção 'credentials: "include"' instrui o navegador a enviar cookies
 * (como o 'connect.sid' da nossa sessão) junto com a requisição.
 * @param {string} method - O método HTTP (GET, POST, etc.).
 * @param {object} [body] - O corpo da requisição para métodos como POST, PUT.
 * @param {boolean} [isFormData] - Se o corpo é FormData.
 * @returns {object} - Objeto de opções para o fetch.
 */
export function getFetchOptions(method = 'GET', body = null, isFormData = false) {
    const options = {
        method: method,
        //  Garante que os cookies de sessão sejam enviados com cada requisição.
        credentials: 'include', 
        headers: {}
    };

    // Não definimos 'Content-Type' para FormData, o navegador faz isso.
    if (!isFormData) {
        options.headers['Content-Type'] = 'application/json';
    }

    if (body) {
        // Se o corpo não for FormData, o transformamos em uma string JSON.
        options.body = isFormData ? body : JSON.stringify(body);
    }

    return options;
}

/**
 * Handles response de um fetch request, parsing JSON e padronizando erros.
 * @param {Response} response - o objeto de resposta.
 * @returns {Promise<any>}  - Retorna os dados da resposta se for bem-sucedida.
 */
export async function handleResponse(response) {
    // para succes responses tipo delete 204, que nao tem corpo
    if (response.ok && response.status === 204) {
        return true;
    }

    const responseData = await response.json().catch(() => null); // handling JSON parsing errors

    if (response.ok) {
        return responseData;
    }

    // padroniza o erro
    //  Define uma mensagem de erro clara.
    const errorMessage = responseData?.error || responseData?.message || `Request failed: ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = responseData; // Anexa o corpo completo da resposta de erro.

    throw error;
}