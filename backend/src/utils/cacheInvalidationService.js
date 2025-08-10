import redis from '../config/redis.js';

/**
 * Invalida (remove) todas as entradas de cache associadas a um ID de documento específico.
 * @param {number} documentId O ID do documento que foi atualizado.
 */
async function invalidateCacheForDocument(documentId) {
    if (!documentId) {
        console.error("Tentativa de invalidar cache sem um ID de documento.");
        return;
    }

    const dependencyKey = `doc_dependencies:${documentId}`;
    console.log(`--- Iniciando invalidação de cache para o Documento ID: ${documentId} ---`);

    try {
        // 1. Encontra todas as chaves de cache que dependem deste documento
        const keysToDelete = await redis.smembers(dependencyKey);

        if (keysToDelete && keysToDelete.length > 0) {
            console.log(` -> Encontradas ${keysToDelete.length} chaves de cache para remover.`);
            
            // 2. Remove todas as chaves de resposta encontradas
            await redis.del(keysToDelete);
            console.log(` -> Chaves de cache removidas com sucesso.`);
        } else {
            console.log(` -> Nenhuma dependência de cache encontrada para este documento.`);
        }

        // 3. Remove o próprio conjunto de dependências, pois ele não é mais necessário
        await redis.del(dependencyKey);
        console.log(` -> Conjunto de dependências removido.`);
        console.log(`--- Invalidação de cache para o Documento ID: ${documentId} finalizada ---`);

    } catch (error) {
        console.error(`Erro durante a invalidação de cache para o Documento ID ${documentId}:`, error);
    }
}

export { invalidateCacheForDocument };