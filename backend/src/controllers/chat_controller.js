import axios from 'axios';
import models from '../models/index.js';
import redis from '../config/redis.js';
import crypto from 'crypto';
import { Sequelize, Op  } from 'sequelize';

// --- Constantes ---
const LLM_EMBED_SERVICE_URL = process.env.LLM_EMBED_URL || 'http://127.0.0.1:8000/embed';
const LLM_GENERATE_SERVICE_URL = process.env.LLM_GENERATE_URL || 'http://127.0.0.1:8000/generate';
const LLM_KEYWORDS_SERVICE_URL = process.env.LLM_KEYWORDS_URL || 'http://127.0.0.1:8000/extract-keywords';
const LLM_CATEGORIZE_SERVICE_URL = process.env.LLM_CATEGORIZE_URL || 'http://127.0.0.1:8000/categorize';
const LLM_CHECK_SIMILARITY_URL = process.env.LLM_CHECK_SIMILARITY_URL || 'http://127.0.0.1:8000/similarity';
const LLM_CHECK_RELEVANCIA_URL = process.env.LLM_CHECK_RELEVANCIA_URL || 'http://127.0.0.1:8000/relevance';

const SIMILARITY_THRESHOLD = process.env.SIMILARITY_THRESHOLD || '0.7' // similaridade mínima para considerar um parágrafo relevante.
const KEYWORD_BOOST_FACTOR = process.env.KEYWORD_BOOST_FACTOR || '0.6'; // Fator de boost para palavras-chave para melhorar a similaridade através de palavras-chave.
const CLASSIFICATION_CONFIDENCE_THRESHOLD = process.env.CLASSIFICATION_CONFIDENCE_THRESHOLD || '0.50'; // Limiar de confiança para considerar uma categorizacao válida.
const LLM_FALLBACK_MESSAGE = "Não encontrei informações sobre isso em minha base de conhecimento. Para sugerir sua dúvida à nossa equipe, clique no botão 'Não' abaixo e sua dúvida será encaminhada e analisada.";
const FEEDBACK_BOOST_FACTOR = process.env.FEEDBACK_BOOST_FACTOR || 0.11; // Fator de boost para feedbacks positivos, usado na similaridade dos parágrafos.


class ChatController {
    constructor() {
        Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter(prop => typeof this[prop] === 'function' && prop !== 'constructor')
            .forEach(prop => { this[prop] = this[prop].bind(this); });
    }

    async handleError(error, res, transaction = null) {
        if (transaction) await transaction.rollback();
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error("CHAT_CONTROLLER_ERROR:", errorMessage, error.stack);
        res.status(500).json({
            message: 'Ocorreu um erro interno no servidor.',
            error: error.message,
        });
    }

    async startSession(req, res) {
    // Se não houver req.user, significa que o middleware de auth não rodou ou falhou.
    if (!req.user || !req.user.id) {
        // Retorna um erro de "Não Autorizado"
        return res.status(401).json({ error: 'Acesso não autorizado. Faça o login para iniciar uma sessão.' });
    }

    const usuario_id = req.user.id;

    try {
        const novaSessao = await models.ChatSessao.create({ usuario_id });
        return res.status(201).json(novaSessao);
    } catch (error) {
        this.handleError(error, res);
    }
}

async addConsulta(req, res) {
  const { sessao_id } = req.params;
  const { texto_consulta, categoria_id, subcategoria_id } = req.body;

  console.log(`\n\n[NOVA CONSULTA] Sessão: ${sessao_id}, Pergunta: "${texto_consulta}"`);

  let t;
  try {
    t = await models.sequelize.transaction();

    const sessao = await models.ChatSessao.findByPk(sessao_id, { transaction: t });
    if (!sessao) {
      await t.rollback();
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    }

    const novaConsulta = await models.ChatConsulta.create({ sessao_id, texto_consulta }, { transaction: t });

    let finalAnswer = "";
    let fontes = [];
    let context = "";

    console.log(`[LOG] Extraindo palavras-chave...`);
    const keywords = await this.extractKeywords(texto_consulta);
    console.log(`[LOG] Palavras-chave extraídas: ${keywords.join(', ')}`);

    if (!keywords || keywords.length === 0) {
      console.log(`[BLOCK] Nenhuma palavra-chave relevante.`);
      finalAnswer = this.getFallbackResponse().texto_resposta;
      fontes = [];

    } else {
      console.log(`[LOG] Executando busca primária por parágrafos...`);
      const docIdsFromKeywords = await this.findDocumentsByKeywords(keywords);
      const topParagraphs = await this.findTopParagraphs(texto_consulta, docIdsFromKeywords, categoria_id, subcategoria_id, 1);

      if (topParagraphs && topParagraphs.length > 0 && topParagraphs[0].similaridade >= 0.55) {
        console.log(`[LOG] Sucesso na busca primária. ${topParagraphs.length} parágrafos encontrados com similaridade relevante.`);
        console.log(`[DEBUG] Similaridade máxima retornada: ${topParagraphs[0]?.similaridade}`);

        context = topParagraphs.map(p => p.paragrafo_texto).join('\n\n---\n\n');
        const onlyParagraphs = topParagraphs.map(p => p.paragrafo_texto);
        fontes = [...new Map(topParagraphs.map(p => [p.documento_id, { id: p.documento_id, titulo: p.documento_titulo }])).values()];

        const simCheck = await axios.post(`${LLM_CHECK_SIMILARITY_URL}`, {
          question: texto_consulta,
          paragraphs: onlyParagraphs
        });

        if (!simCheck.data.result) {
          console.log("[BLOCK] Similaridade baixa entre pergunta e contexto. Checando relevância...");
          const relevanceCheck = await axios.post(`${LLM_CHECK_RELEVANCIA_URL}`, {
            question: texto_consulta,
            context: context
          });

          if (!relevanceCheck.data.result) {
            console.log("[BLOCK] Relevância também baixa. Abortando.");
            finalAnswer = this.getFallbackResponse().texto_resposta;
            fontes = [];
          }
        }

        // Etapa de caching 
        if (!finalAnswer) {
          const hash = crypto.createHash('sha256').update(texto_consulta + context).digest('hex');
          const redisKey = `resposta:${hash}`;
          console.log(`[CACHE] Redis -> Checking key: ${redisKey.substring(0, 25)}...`);

          const redisCachedAnswer = await redis.get(redisKey);

          if (redisCachedAnswer) {
            console.log("[CACHE] Redis HIT");
            finalAnswer = redisCachedAnswer;

          } else {
            console.log("[CACHE] Redis MISS. Checando DB...");
            const cachedAnswerFromDB = await models.CacheRespostas.findOne({ where: { context_hash: hash } });

            if (cachedAnswerFromDB) {
              console.log("[CACHE] DB HIT");
              finalAnswer = cachedAnswerFromDB.answer_text;
              await redis.set(redisKey, finalAnswer);

            } else {
              const contextLength = context.trim().length;
              const paragraphCount = context.split('---').length;
              if (contextLength < 150 && paragraphCount < 2) {
                console.log(`[BLOCK] Contexto fraco (length: ${contextLength}, parágrafos: ${paragraphCount}). Abortando LLM.`);
                finalAnswer = this.getFallbackResponse().texto_resposta;
                fontes = [];

              } else {
                console.log("[CACHE] DB MISS. Chamando LLM...");
                const { answer, isFallback } = await this.generateConversationalAnswer(texto_consulta, context);
                finalAnswer = answer;

                if (!isFallback) {
                  console.log("[CACHE] Salvando no Redis e DB");
                  await redis.set(redisKey, finalAnswer, 'EX', 86400);
                  await models.CacheRespostas.create({
                    context_hash: hash,
                    question_text: texto_consulta,
                    context_text: context,
                    answer_text: finalAnswer
                  }, { transaction: t });
                } else {
                  console.log("[CACHE] Fallback answer. Not saving to cache.");
                }
              }
            }
          }
        }

      } else {
        console.log(`[BLOCK] Busca primária falhou ou teve confiança abaixo do limiar.`);
        finalAnswer = this.getFallbackResponse().texto_resposta;
        fontes = [];
      }
    }

    if (!finalAnswer || finalAnswer.includes(LLM_FALLBACK_MESSAGE)) {
      console.log(`[FALLBACK] Nenhuma resposta satisfatória encontrada. Usando resposta padrão.`);
      finalAnswer = this.getFallbackResponse().texto_resposta;
      fontes = [];
    }

    const documentoFonteId = fontes.length > 0 ? fontes[0].id : null;
    console.log(`[LOG] Criando registro da resposta final no banco de dados.`);
    const novaResposta = await models.ChatResposta.create({
      consulta_id: novaConsulta.id,
      texto_resposta: finalAnswer,
      documento_fonte_id: documentoFonteId
    }, { transaction: t });

    await t.commit();
    console.log(`[LOG] Transação concluída. Enviando resposta 201.`);

    const responsePayload = { consulta: novaConsulta, resposta: novaResposta, fontes: fontes };
    return res.status(201).json(responsePayload);

  } catch (error) {
    console.error('[ERRO FATAL] Ocorreu um erro inesperado no fluxo da consulta:', error);
    this.handleError(error, res, t);
  }
}

    async extractKeywords(text) {
    try {
        const response = await axios.post(LLM_KEYWORDS_SERVICE_URL, { text });
        return response?.data?.keywords || [];

    } catch (error) {
        console.error("Erro ao extrair keywords:", error.message);
        // Retorna um array vazio para que o resto do fluxo do chat não quebre.
        return [];
    }
}

    async findDocumentsByKeywords(keywords) {
    if (!keywords || keywords.length === 0) {
        return [];
    }

    // A sanitização já ocorre no .query, mas para .literal, 
    // é uma boa prática garantir que a entrada seja limpa.
    const lowerCaseKeywords = keywords.map(k => String(k).toLowerCase().replace(/'/g, "''"));

    // Constrói a lista de keywords formatada para a cláusula IN do SQL.
    const keywordsInClause = `(${lowerCaseKeywords.map(k => `'${k}'`).join(',')})`;

    try {
        const topDocuments = await models.Documento.findAll({
            // Seleciona todos os atributos do Documento
            attributes: {
                // E inclui um atributo virtual (calculado) para a contagem de matches
                include: [
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM "documentos_palavras_chaves" AS "jt"
                            INNER JOIN "palavras_chaves" AS "pc" ON "jt"."tag_id" = "pc"."id"
                            WHERE
                                "jt"."documento_id" = "Documento"."id" AND
                                "pc"."nome" IN ${keywordsInClause}
                        )`),
                        'keyword_matches'
                    ]
                ]
            },
            // Filtra para garantir que apenas documentos com pelo menos 1 match sejam retornados
            where: {
                [Op.and]: [
                    { status: 'Aprovado' },
                    // Usamos Sequelize.where e literal para filtrar pela contagem da subquery
                    Sequelize.where(
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM "documentos_palavras_chaves" AS "jt"
                            INNER JOIN "palavras_chaves" AS "pc" ON "jt"."tag_id" = "pc"."id"
                            WHERE
                                "jt"."documento_id" = "Documento"."id" AND
                                "pc"."nome" IN ${keywordsInClause}
                        )`),
                        Op.gt, // Operador "maior que" (greater than)
                        0
                    )
                ]
            },
            // Ordena os resultados pela contagem de matches, do maior para o menor
            order: [
                [Sequelize.literal('keyword_matches'), 'DESC']
            ],
            limit: 10
        });
        
        // Extrai apenas os IDs do resultado
        const uniqueIds = topDocuments.map(doc => doc.id);
        return uniqueIds;

    } catch (error) {
        console.error("Erro durante a busca por palavras-chave com Sequelize:", error);
        return [];
    }
}

    async getQueryEmbedding(text) {
        const cacheKey = `embedding:${text.toLowerCase().trim()}`;
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const response = await axios.post(LLM_EMBED_SERVICE_URL, { input: text });
        const embedding = response?.data?.embedding;
        if (!embedding) throw new Error('API de embedding falhou.');
        await redis.set(cacheKey, JSON.stringify(embedding));
        return embedding;
    }

    
async generateConversationalAnswer(question, context) {
  try {
    const response = await axios.post(LLM_GENERATE_SERVICE_URL, { question, context });
    const llmAnswer = response.data.answer?.trim();

    if (llmAnswer?.startsWith('[NO_ANSWER]') || llmAnswer?.startsWith('**NO_ANSWER**')) {
      console.log("[LOG] LLM sinalizou que não encontrou resposta no contexto.");
      return { answer: LLM_FALLBACK_MESSAGE, isFallback: true };
    }

    return { answer: llmAnswer, isFallback: false };

  } catch (error) {
    console.error("Erro na geração RAG:", error.message);
    return { answer: "Desculpe, não consegui processar a resposta no momento.", isFallback: true };
  }
}


    
async findTopParagraphs(texto_consulta, documentIds = [], categoryId = null, subcategoryId = null, limit = 2) {
        const queryEmbedding = await this.getQueryEmbedding(texto_consulta);
        const queryEmbeddingString = `[${queryEmbedding.join(',')}]`;

        const boostClause = (documentIds.length > 0)
            ? `CASE WHEN "DocumentoParagrafoEmbedding"."documento_id" IN (${documentIds.join(',')}) THEN ${KEYWORD_BOOST_FACTOR} ELSE 0 END`
            : '0';

        const feedbackBonusSubquery = `(SELECT ${FEEDBACK_BOOST_FACTOR} FROM feedbacks fb JOIN chat_consultas cc ON fb.consulta_id = cc.id JOIN chat_respostas cr ON cc.id = cr.consulta_id WHERE cr.documento_fonte_id = "DocumentoParagrafoEmbedding"."documento_id" AND fb.satisfatorio = TRUE LIMIT 1)`;
        const similarityClause = `(1 - ("DocumentoParagrafoEmbedding"."embedding" <=> '${queryEmbeddingString}')) + ${boostClause} + COALESCE(${feedbackBonusSubquery}, 0)`;
        
        const whereConditions = [ Sequelize.literal(`${similarityClause} > ${SIMILARITY_THRESHOLD}`), { '$Documento.status$': 'Aprovado' }];
        if (subcategoryId) { whereConditions.push({ '$Documento.subcategoria_id$': subcategoryId }); }
        
        const includeWhere = {};
        if (categoryId) { includeWhere.categoria_id = categoryId; }

        try {
            const results = await models.DocumentoParagrafoEmbedding.findAll({
                attributes: ['paragrafo_texto', 'documento_id', [Sequelize.literal(similarityClause), 'similaridade']],
                include: [{
                    model: models.Documento, as: 'Documento', attributes: ['titulo', 'subcategoria_id'], required: true,
                    include: [{ model: models.Subcategoria, as: 'subcategoria', attributes: [], where: includeWhere, required: !!categoryId }]
                }],
                where: { [Op.and]: whereConditions },
                order: [[Sequelize.literal('similaridade'), 'DESC']],
                limit: limit
            });

            return results.map(r => ({
                paragrafo_texto: r.get('paragrafo_texto'),
                documento_id: r.get('documento_id'),
                similaridade: r.get('similaridade'),
                documento_titulo: r.Documento.titulo
            }));
        } catch (error) {
            console.error("Erro na busca por similaridade:", error);
            return [];
        }
    }



    async fallbackSearchByKeywords(keywords) {
        if (!keywords || keywords.length === 0) {
            return [];
        }
        
        // Constrói uma query para Full-Text Search (ex: 'palavra1' & 'palavra2')
        const ftsQuery = keywords.map(k => k.replace(/[\s:&|!<>]/g, '').trim()).filter(Boolean).join(' & ');
        if (!ftsQuery) return [];

        try {
            const results = await models.DocumentoParagrafoEmbedding.findAll({
                attributes: ['paragrafo_texto', 'documento_id'],
                include: [{
                    model: models.Documento,
                    as: 'Documento',
                    attributes: ['titulo'],
                    where: { status: 'Aprovado' },
                    required: true
                }],
                where: Sequelize.literal(`to_tsvector('portuguese', "paragrafo_texto") @@ to_tsquery('portuguese', '${ftsQuery}')`),
                limit: 3 // Pega até 3 parágrafos no fallback
            });

            return results.map(r => ({
                paragrafo_texto: r.get('paragrafo_texto'),
                documento_id: r.get('documento_id'),
                documento_titulo: r.Documento.titulo
            }));
        } catch (error) {
            console.error("Erro na busca de fallback por keywords:", error);
            return [];
        }
    }
    
    getFallbackResponse() {
        return {
            texto_resposta: "Desculpe, não encontrei uma resposta para sua pergunta em minha base de conhecimento. Para sugerir sua dúvida à nossa equipe, clique no botão 'Não' abaixo e sua dúvida será encaminhada e analisada.",
            documento_fonte_id: null,
            fontes: []
        };
    }

    async getPopularQuestions(req, res) {
        try {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            const popularConsultas = await models.ChatConsulta.findAll({
                attributes: [
                    'texto_consulta',
                    [models.sequelize.fn('COUNT', models.sequelize.col('ChatConsulta.id')), 'frequency']
                ],
                include: [
                    {
                        model: models.ChatResposta,
                        as: 'chatResposta',
                        attributes: [],
                        required: true,
                        where: {
                            documento_fonte_id: { [Op.ne]: null }
                        }
                    },
                    {
                        model: models.Feedback,
                        as: 'feedback',
                        attributes: [],
                        required: true,
                        where: {
                            satisfatorio: true
                        }
                    }
                ],
                where: {
                    datahora_consulta: {
                        [Op.gte]: ninetyDaysAgo
                    }
                },
                group: ['texto_consulta'],
                order: [
                    [models.sequelize.literal('frequency'), 'DESC']
                ],
                limit: 8,
                raw: true
            });

            const questions = popularConsultas.map(item => item.texto_consulta);
            return res.status(200).json(questions);
        } catch (error) {
            this.handleError(error, res);
        }
    }

    async getHistory(req, res) {
        try {
            const { sessao_id } = req.params;
            const page = parseInt(req.query.page || '1', 10);
            const limit = 10;
            const offset = (page - 1) * limit;
            const history = await models.ChatConsulta.findAll({
                where: { sessao_id },
                include: [{ model: models.ChatResposta, as: 'chatResposta' }],
                order: [['datahora_consulta', 'DESC']],
                limit,
                offset
            });
            return res.status(200).json(history);
        } catch (error) {
            this.handleError(error, res);
        }
    }

    async addFeedback(req, res) {
        const { consulta_id } = req.params;
        const { satisfatorio } = req.body;
        if (satisfatorio === undefined) {
            return res.status(400).json({ error: 'O campo "satisfatorio" é obrigatório.' });
        }
        const t = await models.sequelize.transaction();
        try {
            await models.Feedback.create({ consulta_id, satisfatorio }, { transaction: t });

        if (satisfatorio === false) {
            const consulta = await models.ChatConsulta.findByPk(consulta_id);
            if (consulta) {
                const suggestedCategory = await this.categorizeIssue(consulta.texto_consulta);

                await models.AssuntoPendente.findOrCreate({
                    where: { consulta_id },
                    defaults: {
                        texto_assunto: consulta.texto_consulta, // Salva a pergunta original
                        status: 'Aberto',
                        categoria_id: suggestedCategory.categoria_id, // Salva a categoria sugerida
                        subcategoria_id: suggestedCategory.subcategoria_id // Salva a subcategoria sugerida
                    },
                    transaction: t
                });
            }
        }
            await t.commit();
            return res.status(201).json({ message: "Feedback recebido com sucesso." });
        } catch (error) {
            this.handleError(error, res, t);
        }
    }

    async categorizeIssue(userQuery) {
        try {
            const categoriesFromDB = await models.Categoria.findAll({
                attributes: ['id', 'nome'],
                include: [{
                    model: models.Subcategoria,
                    as: 'subcategorias',
                    attributes: ['id', 'nome']
                }]
            });

            if (!categoriesFromDB || categoriesFromDB.length === 0) {
                console.log("--> Nenhuma categoria encontrada no banco para classificação.");
                return { categoria_id: null, subcategoria_id: null };
            }
            
            const mainCategoryLabels = categoriesFromDB.map(c => c.nome);

        // Apenas para log, vamos encontrar a categoria principal primeiro para saber quais subcategorias usar
        const firstPassResult = await axios.post(LLM_CATEGORIZE_SERVICE_URL, {
            text: userQuery,
            label_sets: {
                main_category: mainCategoryLabels
            }
        });
        
        const mainCategoryName = firstPassResult.data.results.main_category?.predicted_category;
        const mainCategoryConfidence = firstPassResult.data.results.main_category?.confidence_score;

        if (!mainCategoryName || mainCategoryConfidence < CLASSIFICATION_CONFIDENCE_THRESHOLD) {
            console.log(`--> Confiança da categoria principal (${mainCategoryConfidence?.toFixed(2)}) abaixo do limiar.`);
            return { categoria_id: null, subcategoria_id: null };
        }

        const matchedCategory = categoriesFromDB.find(c => c.nome === mainCategoryName);
        if (!matchedCategory) return { categoria_id: null, subcategoria_id: null };

        const final_categoria_id = matchedCategory.id;
        let final_subcategoria_id = null;
        
        const subCategoryLabels = matchedCategory.subcategorias.map(s => s.nome);

        // Se houver subcategorias, faz a segunda chamada (ou a chamada única otimizada)
        if (subCategoryLabels.length > 0) {
            // Agora com a chamada otimizada, podemos re-classificar se quisermos, mas a abordagem de 2 passos ainda é válida
            // para evitar classificar contra uma lista gigante de subcategorias irrelevantes.
            // vamos apenas classificar as subcategorias da categoria já encontrada:
             const subCatResponse = await axios.post(LLM_CATEGORIZE_SERVICE_URL, {
                text: userQuery,
                label_sets: {
                     // Passamos apenas o conjunto que queremos classificar agora
                    sub_category: subCategoryLabels
                }
            });

            const subCatResult = subCatResponse.data.results.sub_category;
            if (subCatResult && subCatResult.confidence_score >= CLASSIFICATION_CONFIDENCE_THRESHOLD) {
                const matchedSubCategory = matchedCategory.subcategorias.find(s => s.nome === subCatResult.predicted_category);
                if (matchedSubCategory) {
                    final_subcategoria_id = matchedSubCategory.id;
                }
            } else {
                 console.log(`--> Confiança da subcategoria (${subCatResult?.confidence_score.toFixed(2)}) abaixo do limiar.`);
            }
        }
        
        console.log(`--> Classificação final: CatID ${final_categoria_id}, SubCatID ${final_subcategoria_id}`);
        return { categoria_id: final_categoria_id, subcategoria_id: final_subcategoria_id };

    } catch (error) {
        console.error("Erro ao chamar serviço de categorização:", error.message);
        return { categoria_id: null, subcategoria_id: null };
    }
}

    
    async addAssuntoPendente(req, res) {
        const { consulta_id } = req.body;
        if (!consulta_id) {
            return res.status(400).json({ error: 'O ID da consulta original é obrigatório.' });
        }

        try {
            const consulta = await models.ChatConsulta.findByPk(consulta_id);
            if (!consulta) {
                return res.status(404).json({ error: 'Consulta original não encontrada.' });
            }
            

            const suggestedCategory = await this.categorizeIssue(consulta.texto_consulta);

            // Usa findOrCreate para criar o assunto apenas se ele não existir
            const [assunto, created] = await models.AssuntoPendente.findOrCreate({
                where: { consulta_id: consulta_id },
                defaults: {
                    texto_assunto: consulta.texto_consulta,
                    status: 'Aberto',
                    categoria_id: suggestedCategory.categoria_id,
                    subcategoria_id: suggestedCategory.subcategoria_id
                }
            });

            // Agora, tratamos ambos os casos (criado agora ou já existente) como sucesso.
            
            const statusCode = created ? 201 : 200; // 201 (Created) se for novo, 200 (OK) se já existia.
            const message = created 
                ? 'Sugestão recebida e categorizada com sucesso!' 
                : 'Esta sugestão já havia sido registrada anteriormente.';

            return res.status(statusCode).json({ message, data: assunto });

        } catch (error) {
            // Sua função de tratamento de erro
            this.handleError(error, res);
        }
    }

}

export default new ChatController();