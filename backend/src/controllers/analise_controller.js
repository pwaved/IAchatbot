import { sequelize } from '../config/database.js';
import { Op } from 'sequelize';
import Documento from '../models/documento_model.js';
import Subcategoria from '../models/subcategoria_model.js';
import Categoria from '../models/categoria_model.js';
import ChatConsulta from '../models/chatConsulta_model.js';
import ChatResposta from '../models/chatResposta_model.js';
import Feedback from '../models/feedback_model.js';


/**
 * @class AnalyticsController
 * @desc Manipula a agregação e análise de dados para o painel de administração.
 */
class AnalyticsController {
    /**
     * @desc    Coleta dados analíticos abrangentes para o painel,
     * incluindo estatísticas de documentos e interações recentes do chat.
     * @route   GET /api/analytics/data
     * @access  AUTH/Admin
     */
    async getAnalyticsData(req, res, next) { 
        try {
            // --- Documentos para revisão (com mais de 6 meses) ---
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const documentsForReview = await Documento.findAll({
                where: {
                    updatedAt: { [Op.lt]: sixMonthsAgo },
                },
                include: [
                    {
                        model: Subcategoria,
                        as: 'subcategoria',
                        include: {
                            model: Categoria,
                            as: 'categoria',
                        },
                    },
                ],
                order: [['updatedAt', 'ASC']],
            });

            // --- Contagem de Documentos por Categoria ---
            const categoryStats = await Categoria.findAll({
                attributes: [
                    'nome',
                    [sequelize.fn('COUNT', sequelize.col('subcategorias.documentos.id')), 'documentCount']
                ],
                include: {
                    model: Subcategoria,
                    as: 'subcategorias',
                    attributes: [],
                    include: {
                        model: Documento,
                        as: 'documentos',
                        attributes: []
                    }
                },
                group: ['Categoria.id'],
                order: [[sequelize.fn('COUNT', sequelize.col('subcategorias.documentos.id')), 'DESC']]
            });

            // --- Contagem de Documentos por Subcategoria ---
            const subcategoryStats = await Subcategoria.findAll({
                attributes: [
                    'nome',
                    [sequelize.fn('COUNT', sequelize.col('documentos.id')), 'documentCount']
                ],
                include: {
                    model: Documento,
                    as: 'documentos',
                    attributes: []
                },
                group: ['Subcategoria.id'],
                order: [[sequelize.fn('COUNT', sequelize.col('documentos.id')), 'DESC']]
            });

            // ---  BUSCAR ÚLTIMAS CONSULTAS DO CHAT ---
            // Esta consulta busca as interações mais recentes do chat,

            const latestConsultations = await ChatConsulta.findAll({
                limit: 7, // Obter as 15 consultas mais recentes
                order: [['datahora_consulta', 'DESC']],
                include: [
                    {
                        model: ChatResposta,
                        as: 'chatResposta', 
                        include: {
                            model: Documento,
                            as: 'documento_fonte', 
                            attributes: ['id', 'titulo'], // Buscar apenas as informações necessárias do documento
                        }
                    },
                    {
                        model: Feedback,
                        as: 'feedback' 
                    }
                ]
            });

             const feedbackStats = await Feedback.findAndCountAll({
                attributes: ['satisfatorio'],
                group: ['satisfatorio'],
                include: [{
                    model: ChatConsulta, 
                    attributes: [],     
                    required: true,      // Garante que o feedback tenha uma consulta associada
                    include: [{        
                        model: ChatResposta,
                        as: 'chatResposta', //  ChatConsulta -> ChatResposta
                        attributes: [],
                        where: {
                            // A condição para contar apenas respostas com documentos permanece aqui
                            documento_fonte_id: { [Op.not]: null } 
                        },
                        required: true // Garante que a consulta tenha uma resposta com documento
                    }]
                }]
            });
            
            const searchResults = await ChatConsulta.findAll({
                attributes: [
                    'texto_consulta',
                    // Contamos as ocorrências de cada texto_consulta
                    [sequelize.fn('COUNT', sequelize.col('ChatConsulta.id')), 'count']
                ],
                include: [{
                    model: ChatResposta,
                    as: 'chatResposta',
                    attributes: [], // Não precisamos de colunas da resposta aqui
                    required: true, // INNER JOIN: apenas consultas com resposta
                    where: {
                        documento_fonte_id: { [Op.not]: null } // Apenas respostas que encontraram um documento
                    },
                    include: [{
                        model: Documento,
                        as: 'documento_fonte',
                        attributes: [], // Não precisamos de colunas do documento
                        required: true, // INNER JOIN
                        include: [{
                            model: Subcategoria,
                            as: 'subcategoria',
                            attributes: [], // Não precisamos de colunas da subcategoria
                            required: true, // INNER JOIN
                            include: [{
                                model: Categoria,
                                as: 'categoria',
                                attributes: ['nome'], //  Pegamos o nome da categoria
                                required: true, // INNER JOIN
                            }]
                        }]
                    }]
                }],
                group: [
                    'texto_consulta',
                    // Agrupamos também pelo nome da categoria associada
                    'chatResposta.documento_fonte.subcategoria.categoria.id',
                    'chatResposta.documento_fonte.subcategoria.categoria.nome'
                ],
                order: [
                    // Ordena por contagem para facilitar o processamento
                    [sequelize.literal('count'), 'DESC']
                ],
                raw: true, // Retorna dados brutos, mais fáceis de processar
                nest: true // Aninha os includes para facilitar o acesso
            });

            // Transforma o resultado plano da query na estrutura aninhada desejada.
            const searchesByCategory = searchResults.reduce((acc, item) => {
                const categoryName = item.chatResposta.documento_fonte.subcategoria.categoria.nome;
                
                // Se a categoria ainda não existe no nosso acumulador, a criamos
                if (!acc[categoryName]) {
                    acc[categoryName] = [];
                }

                // Adicionamos o termo e sua contagem à categoria correspondente
                acc[categoryName].push({
                    term: item.texto_consulta,
                    count: parseInt(item.count, 10) // Garante que a contagem é um número
                });
                
                return acc;
            }, {});

            // Converte o objeto em um array e limita a 5-7 termos por categoria.
            const topSearchesByCategory = Object.entries(searchesByCategory).map(([category, searches]) => ({
                category: category,
                // O `slice(0, 5)` pega os 5 termos mais pesquisados, pois já ordenamos na query
                searches: searches.slice(0, 5) 
            }));

            res.status(200).json({
                documentsForReview,
                categoryStats,
                subcategoryStats,
                latestConsultations,
                feedbackStats: feedbackStats.count,
                topSearchesByCategory// Envia os resultados da nova query
            });



        } catch (error) {
            console.error("Erro ao buscar dados analíticos:", error);
            next(error);
        }
    }


/**
     * @desc    Busca consultas do chat com filtros e paginação.
     * @route   GET /api/analytics/consultations/search
     * @access  AUTH/Admin
     */
    async searchConsultations(req, res, next) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                feedbackStatus, // 'satisfactory', 'unsatisfactory', 'none'
                docFound,       // 'true', 'false'
                searchTerm      // texto da busca
            } = req.query;

            const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

            // --- Montagem dinâmica dos filtros ---
            const whereClause = {};
            if (searchTerm) {
                whereClause.texto_consulta = { [Op.iLike]: `%${searchTerm}%` };
            }

            const includeFilters = [];
            const feedbackInclude = {
                model: Feedback,
                as: 'feedback',
                required: false // LEFT JOIN para pegar consultas sem feedback
            };
            
            if (feedbackStatus === 'satisfactory') {
                feedbackInclude.where = { satisfatorio: true };
                feedbackInclude.required = true; // INNER JOIN
            } else if (feedbackStatus === 'unsatisfactory') {
                feedbackInclude.where = { satisfatorio: false };
                feedbackInclude.required = true; // INNER JOIN
            } else if (feedbackStatus === 'none') {
                feedbackInclude.where = { id: { [Op.is]: null } };
            }
            includeFilters.push(feedbackInclude);

            const respostaInclude = {
                model: ChatResposta,
                as: 'chatResposta',
                required: false, // LEFT JOIN
                include: { model: Documento, as: 'documento_fonte', attributes: ['id', 'titulo'] }
            };

            if (docFound === 'true') {
                respostaInclude.where = { documento_fonte_id: { [Op.not]: null } };
                respostaInclude.required = true; // INNER JOIN
            } else if (docFound === 'false') {
                 respostaInclude.where = { documento_fonte_id: { [Op.is]: null } };
            }
            includeFilters.push(respostaInclude);


            const { count, rows } = await ChatConsulta.findAndCountAll({
                where: whereClause,
                include: includeFilters,
                order: [['datahora_consulta', 'DESC']],
                limit: parseInt(limit, 10),
                offset: offset,
                distinct: true // Importante para contagem correta com includes
            });

            res.status(200).json({
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page, 10),
                consultations: rows
            });

        } catch (error) {
            console.error("Erro ao buscar consultas:", error);
            next(error);
        }
    }
}

export default new AnalyticsController();

