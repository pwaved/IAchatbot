import os
import json
from dotenv import load_dotenv
from groq import Groq  
from sentence_transformers import SentenceTransformer
from transformers import pipeline
import time 
from sklearn.metrics.pairwise import cosine_similarity
# Carrega as variáveis de ambiente
load_dotenv()

# --- Configuração ---
EMBEDDING_MODEL_NAME = "intfloat/multilingual-e5-large"
GROQ_RAG_MODEL = "llama3-70b-8192"
GROQ_KEYWORD_MODEL = "gemma2-9b-it"
CLASSIFICATION_MODEL_NAME = "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli"

# --- Inicialização dos Modelos e Clientes ---
try:
    print("--- INICIANDO APLICAÇÃO DE IA ---")

    # Cliente da Groq
    llama_api_key = os.getenv("GROQ_API_KEY")
    groq_client_llama = Groq(api_key=llama_api_key)
    # Cliente da Groq para o modelo Gemma
    gemma_api_key = os.getenv("GROQ_API_KEY_GEMMA")
    groq_client_gemma = Groq(api_key=gemma_api_key)
    
    # Modelo de Embedding
    print(f"Carregando modelo de embedding: {EMBEDDING_MODEL_NAME}...")
    # ---Inicializa o SentenceTransformer diretamente
    embeddings_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    print("Modelo de embedding carregado!")

    # Modelo de Classificação DeBERTa
    print(f"Carregando modelo de classificação (DeBERTa): {CLASSIFICATION_MODEL_NAME}...")
    classifier = pipeline("zero-shot-classification", model=CLASSIFICATION_MODEL_NAME)
    print("Modelo de classificação (DeBERTa) carregado!")
    print("Todos os modelos e clientes foram configurados com sucesso!")

except Exception as e:
    print(f"ERRO CRÍTICO ao inicializar serviços de IA: {e}")
    raise e

# Função para gerar resposta RAG ---
def generate_rag_response(question: str, context: str) -> str:
    start_time = time.time() 
    print(f"[LOG] Iniciando generate_rag_response para a pergunta: '{question[:30]}...'")

    """
    Gera uma resposta usando o modelo de RAG da Groq.
    """
    #  Alteramos a regra 5 para retornar um sinal, não uma frase.
    system_prompt = """Sua função é ser um motor de busca factual. Você deve processar a PERGUNTA do usuário e respondê-la usando **única e exclusivamente** as informações contidas no CONTEXTO.

**REGRAS INQUEBRÁVEIS E PRIORITÁRIAS:**

1.  **FOCO TOTAL NO CONTEXTO:** Você está **ESTRITAMENTE PROIBIDO** de usar qualquer informação, conhecimento ou capacidade de raciocínio que não venha diretamente do CONTEXTO. Sua memória foi apagada; só existe o CONTEXTO.

2.  **PROIBIÇÃO DE OPINIÕES E CONSELHOS:** **NÃO** forneça conselhos, opiniões, sugestões ou recomendações (ex: "é recomendável que..."). Apenas extraia fatos.

3.  **ATENÇÃO MÁXIMA AOS DETALHES:** Leia o CONTEXTO por completo, do início ao fim, prestando atenção especial em todas as **condições, exceções e cenários alternativos** (ex: "caso o cliente não possa..."). Se uma exceção se aplica à PERGUNTA, sua resposta **DEVE** mencioná-la.

4.  **RECUSA A NÃO-PERGUNTAS:** Se a PERGUNTA não for uma solicitação de informação (ex: um agradecimento), ignore o CONTEXTO e use o sinal de falha.

5.  **OBRIGATORIEDADE DA FALHA:** Se o CONTEXTO não contém a resposta exata para a PERGUNTA, sua **ÚNICA** ação permitida é responder **EXATAMENTE** com o seguinte sinal e nada mais: [NO_ANSWER]

"""
    human_prompt = f"""--- CONTEXTO ---
{context}
--- FIM DO CONTEXTO ---

PERGUNTA:
{question}

RESPOSTA:"""

    chat_completion = groq_client_llama.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": human_prompt}
        ],
        model=GROQ_RAG_MODEL,
        temperature=0.0,
    )
    end_time = time.time()
    print(f"[LOG] generate_rag_response finalizado em {end_time - start_time:.2f} segundos.")
    return chat_completion.choices[0].message.content


def extract_keywords_with_groq(text: str) -> list:
    """
    Extrai palavras-chave de um texto usando a Groq e força a saída em JSON.
    """
    #  O prompt agora pede um OBJETO JSON com uma chave "keywords".
    system_prompt = """Sua tarefa é analisar o texto fornecido e extrair as palavras-chave mais importantes.
Você DEVE retornar sua resposta como um OBJETO JSON contendo uma única chave chamada "keywords", que contém a lista de strings.
Exemplo de saída: {"keywords": ["palavra-chave 1", "palavras-chave 2", "outro termo importante"]}"""
    
    human_prompt = f"Aqui está o texto para analisar:\n\nTEXTO: {text}\n\nPALAVRAS-CHAVE:"

    # A chamada para a API pede um json_object como formato de resposta.
    # Isso garante que a resposta seja formatada como um objeto JSON.
    chat_completion = groq_client_gemma.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": human_prompt}
        ],
        model=GROQ_KEYWORD_MODEL,
        temperature=0,
        response_format={"type": "json_object"},
    )
    
    response_content = chat_completion.choices[0].message.content
    
    try:
        # Sabemos que a resposta será um dicionário, então acessamos a chave "keywords" diretamente.
        parsed_json = json.loads(response_content)
        # Usar .get() é mais seguro, pois retorna uma lista vazia se a chave não for encontrada.
        return parsed_json.get("keywords", [])

    except (json.JSONDecodeError, AttributeError) as e:
        print(f"ERRO: Falha ao decodificar ou processar a resposta JSON da API. Conteúdo: {response_content}. Erro: {e}")
        return []


#  gerar embeddings 
def get_embeddings(texts: list[str] | str): 
    """Gera o embedding para um texto ou uma lista de textos."""
    start_time = time.time() 
    
    # Verifica se a entrada é uma lista 
    is_batch = isinstance(texts, list)
    log_text = f"{len(texts)} textos em lote" if is_batch else f"o texto '{texts[:30]}...'"
    print(f"[LOG] Iniciando get_embeddings para {log_text}")

    # A função .encode() do SentenceTransformer já lida com string ou lista de strings nativamente
    embeddings = embeddings_model.encode(texts)
    
    end_time = time.time() 
    print(f"[LOG] get_embeddings finalizado em {end_time - start_time:.2f} segundos.")
    return embeddings

def is_context_similar(question: str, paragraphs: list[str]) -> bool:
    q_emb = get_embeddings(question)
    p_embs = get_embeddings(paragraphs)
    sims = cosine_similarity([q_emb], p_embs)[0]
    max_sim = max(sims)
    print(f"[LOG] Similaridade máxima entre pergunta e parágrafos: {max_sim:.2f}")
    return max_sim > 0.5


def should_generate_answer(question: str, context: str) -> bool:
    result = classifier(
        sequences=question,
        candidate_labels=[context],
        hypothesis_template="Essa pergunta é respondida por: {}"
    )
    score = result["scores"][0]
    print(f"[LOG] Confiança do classificador: {score:.2f}")
    return score > 0.5
