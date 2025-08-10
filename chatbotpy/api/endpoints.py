import traceback
from fastapi import APIRouter, HTTPException
from llm.llm_services import (
    get_embeddings,
    generate_rag_response,
    extract_keywords_with_groq,
    classifier, is_context_similar,
    should_generate_answer
)

# Importa os esquemas Pydantic 
from schemas.chat import (
    EmbeddingRequest, EmbeddingResponse, 
    GenerationRequest, GenerationResponse, 
    KeywordExtractionRequest, KeywordExtractionResponse,
    MultiCategorizationRequest, MultiCategorizationResponse, CategorizationResult
    ,SimilarityRequest, RelevanceRequest, BooleanResponse
)

router = APIRouter()

@router.post("/embed", response_model=EmbeddingResponse)
async def create_embedding(request: EmbeddingRequest):
    if not request.input:
        raise HTTPException(status_code=400, detail="A entrada para embedding não pode ser vazia.")
    
    try:
        #  A função get_embeddings já aceita string ou lista e retorna um ou mais vetores (numpy)
        embedding_vectors = get_embeddings(request.input)
        
        #  O método .tolist() converte o resultado para o formato de lista Python correto,
        #    seja para um único vetor ou para uma lista de vetores.
        response_data = embedding_vectors.tolist()

        #  Retorna a resposta, que agora corresponde ao schema flexível EmbeddingResponse
        return EmbeddingResponse(embedding=response_data)

    except Exception as e:
        print(f"--- ERRO INESPERADO NO ENDPOINT /embed ---")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Endpoint /generate 
@router.post("/generate", response_model=GenerationResponse)
async def generate_answer(request: GenerationRequest):
    try:
        #  Chama a função generate_rag_response diretamente 
        result = generate_rag_response(question=request.question, context=request.context)
        return GenerationResponse(answer=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint /extract-keywords
@router.post("/extract-keywords", response_model=KeywordExtractionResponse)
async def extract_keywords(request: KeywordExtractionRequest):
    """
    Extrai frases-chave usando o modelo Groq.
    """
    try:
        # retorna uma lista limpa de palavras e frases-chave.
        keywords = extract_keywords_with_groq(request.text)
        
        # A função já retorna uma lista, que é o formato esperado pela resposta.
        return KeywordExtractionResponse(keywords=keywords)
        
    except Exception as e:
        print("--- ERRO INESPERADO NO ENDPOINT /extract-keywords ---")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro interno no servidor: {str(e)}")
    
@router.post("/similarity" , response_model=BooleanResponse)
async def check_similarity(data: SimilarityRequest):
    result = is_context_similar(data.question, data.paragraphs)
    return {"result": bool(result)}


@router.post("/relevance", response_model=BooleanResponse)
async def check_relevance(data: RelevanceRequest):
    result = should_generate_answer(data.question, data.context)
    return {"result": bool(result)}

# Endpoint /categorize 
@router.post("/categorize", response_model=MultiCategorizationResponse)
async def categorize_text_multi(request: MultiCategorizationRequest):
    if classifier is None:
        raise HTTPException(status_code=503, detail="O modelo de classificação não está disponível.")
    response_data = {}
    # hypothesis template é uma string que define como o classificador deve interpretar o texto para melhor compatibilidade com o Português.
    # Ela é usada para criar uma hipótese que o classificador pode usar para entender o contexto
    hypothesis_template = "Este texto se refere a {}."
    try:
        # Itera sobre cada conjunto de labels enviado na requisição
        for set_name, labels in request.label_sets.items():
            if not labels:
                continue
            # Pass the corrected template to the classifier
            result = classifier(
                request.text,
                candidate_labels=labels,
                hypothesis_template=hypothesis_template
            )

            # Armazena o resultado no dicionário de resposta
            response_data[set_name] = CategorizationResult(
                predicted_category=result['labels'][0],
                confidence_score=result['scores'][0]
            )
            print(f"[LOG] Classificação para '{set_name}': {result['labels'][0]} com confiança {result['scores'][0]:.4f}")
        return MultiCategorizationResponse(results=response_data)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao categorizar texto: {str(e)}")