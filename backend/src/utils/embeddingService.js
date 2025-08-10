import axios from 'axios';
import models from '../models/index.js';
import mammoth from 'mammoth';
import pdf from 'pdf-parse-debugging-disabled'

const LLM_EMBED_SERVICE_URL = process.env.LLM_EMBED_URL || 'http://127.0.0.1:8000/embed';

/**
 * Divide o texto em sentenças. Usa uma RegEx para tentar lidar com casos como abreviações.
 * @param {string} text - O texto a ser dividido.
 * @returns {string[]} Um array de sentenças.
 */
function splitTextIntoSentences(text) {
    if (!text) return [];
    // Esta RegEx tenta dividir por ponto, interrogação e exclamação, 
    // mas evita quebras em abreviações comuns (ex: "Dr.", "Sr.", "p. ex.").
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g);
    return sentences ? sentences.map(s => s.trim()).filter(s => s.length > 0) : [];
}

/**
 * Divide o texto em pedaços (chunks) de forma semântica
 * @param {string} text - O conteúdo do documento.
 * @returns {Promise<string[]>} Uma promise que resolve para um array de pedaços de texto.
 */
async function splitTextIntoChunks(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }

    const chunkSize = 500;
    const chunkOverlap = 50;

    const sentences = splitTextIntoSentences(text);
    if (sentences.length === 0) {
        // Se não conseguir dividir em sentenças, recorre a uma divisão mais simples
        // (Este é um fallback, a divisão por sentenças é preferível)
        if (text.length > chunkSize) {
            const chunks = [];
            for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
                chunks.push(text.substring(i, i + chunkSize));
            }
            return chunks;
        }
        return [text];
    }

    const chunks = [];
    let currentChunk = "";

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];

        // Se adicionar a próxima sentença exceder o tamanho do chunk...
        if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk);

            // Inicia o próximo chunk com uma sobreposição
            const lastSentencesForOverlap = splitTextIntoSentences(currentChunk)
                                             .slice(-3) // Pega as últimas 3 sentenças para overlap
                                             .join(' '); 
            
            let overlapText = lastSentencesForOverlap.length > chunkOverlap 
                ? lastSentencesForOverlap.substring(lastSentencesForOverlap.length - chunkOverlap)
                : lastSentencesForOverlap;

            currentChunk = overlapText + "... ";
        }

        currentChunk += sentence + " ";
    }
    
    // Adiciona o último chunk que sobrou
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Extrai texto diretamente de um Buffer de dados.
 * @param {Buffer} fileBuffer - O conteúdo do arquivo em formato de Buffer (vindo do BLOB).
 * @param {string} mimeType - O tipo MIME do arquivo para direcionar o parser correto.
 * @returns {Promise<string>} O texto extraído do arquivo.
 */
async function extractTextFromBuffer(fileBuffer, mimeType) { // <--- Recebe Buffer, não path
    console.log(` -> Extraindo texto diretamente do Buffer (${mimeType})`);
    try {
        if (!fileBuffer) {
            return '';
        }

        if (mimeType === 'application/pdf') {
            const data = await pdf(fileBuffer); // <--- Passa o buffer direto
            return data.text;
        }

        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const { value } = await mammoth.extractRawText({ buffer: fileBuffer }); //  Passa o buffer direto
            return value;
        }

        console.warn(` -> Tipo de arquivo não suportado para extração: ${mimeType}`);
        return '';

    } catch (error) {
        console.error(` -> Falha ao extrair texto do Buffer:`, error);
        return '';
    }
}


/**
 * (VERSÃO ATUALIZADA) Gera e salva os embeddings para um documento,
 * lendo o anexo diretamente do BLOB do banco de dados.
 * @param {object} doc - A instância do documento do Sequelize.
 */
async function generateEmbeddingsForDocument(doc) {
    console.log(`--- Iniciando geração de embeddings para o Documento ID: ${doc.id} ---`);
    const startTime = Date.now();

    try {
        let fullTextContent = doc.conteudo || '';

        //  Bloco para processar anexos a partir do BLOB
        // Acessa os dados do anexo diretamente do objeto 'doc'
        if (doc.anexo_arquivo && doc.anexo_mimetype) { //  Verifica o BLOB
            const extractedText = await extractTextFromBuffer(doc.anexo_arquivo, doc.anexo_mimetype);
            if (extractedText) {
                fullTextContent += `\n\n--- CONTEÚDO DO ANEXO ---\n\n${extractedText}`;
            }
        }
        
        // O resto da função continua exatamente como antes...
        if (typeof fullTextContent !== 'string' || fullTextContent.trim() === '') {
            console.log(` -> Documento ID: ${doc.id} não possui conteúdo válido. Pulando.`);
            return;
        }

        await models.DocumentoParagrafoEmbedding.destroy({ where: { documento_id: doc.id } });
        console.log(` -> Embeddings antigos do documento ${doc.id} removidos.`);

        const chunks = await splitTextIntoChunks(fullTextContent);

        if (!chunks || chunks.length === 0) {
            console.log(' -> Nenhum pedaço de texto válido para gerar embedding.');
            return;
        }
        console.log(` -> Documento dividido em ${chunks.length} pedaços. Gerando embeddings em lote...`);

        const response = await axios.post(LLM_EMBED_SERVICE_URL, { input: chunks });
        const embeddings = response?.data?.embedding;

        if (!embeddings || !Array.isArray(embeddings) || embeddings.length !== chunks.length) {
            throw new Error('API de embedding não retornou um lote de vetores válido.');
        }

        const paragraphsToCreate = chunks.map((chunkText, index) => ({
            documento_id: doc.id,
            paragrafo_texto: chunkText,
            embedding: `[${embeddings[index].join(',')}]`
        }));
        
        await models.DocumentoParagrafoEmbedding.bulkCreate(paragraphsToCreate);

        const duration = (Date.now() - startTime) / 1000;
        console.log(`--- Finalizada a geração de ${chunks.length} embeddings para o Doc ID: ${doc.id} em ${duration.toFixed(2)}s ---`);

    } catch (error) {
        console.error(`Ocorreu um erro geral ao gerar embeddings para o doc ${doc.id}:`, error.message);
        if (error.response) {
            console.error(' -> Detalhes do erro da API:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

/**
 * Remove todos os embeddings associados a um documento.
 * @param {object} doc - A instância do documento do Sequelize.
 */
async function removeEmbeddingsForDocument(doc) {
    console.log(`--- Removendo embeddings para o Documento ID: ${doc.id} ---`);
    await models.DocumentoParagrafoEmbedding.destroy({
        where: { documento_id: doc.id }
    });
}

export { generateEmbeddingsForDocument, removeEmbeddingsForDocument };
