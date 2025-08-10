# schemas/chat.py

from pydantic import BaseModel
from typing import List, Union , Dict

#  Schema para Requisição de Embedding 
class EmbeddingRequest(BaseModel):
    #  Permite que 'input' seja uma string ou uma lista de strings
    input: Union[str, List[str]]

#  Schema para Resposta de Embedding 
class EmbeddingResponse(BaseModel):
    # Permite que a resposta seja um único vetor ou uma lista de vetores
    embedding: Union[List[float], List[List[float]]]
#  Schema para Requisição de pedido de Geração
class GenerationRequest(BaseModel):
    context: str
    question: str
#  resposta de geração
class GenerationResponse(BaseModel):
    answer: str
# pedido extracao de palavras-chave com GROQ
class KeywordExtractionRequest(BaseModel):
    text: str
# resposta de extracao de palavras-chave com GROQ
class KeywordExtractionResponse(BaseModel):
    keywords: List[str]
# pedido de categorizaçao com sentence transformers
class MultiCategorizationRequest(BaseModel):
    text: str
    # Um dicionário onde a chave é o nome do conjunto (ex: "main_category")
    # e o valor é a lista de labels para aquele conjunto.
    label_sets: Dict[str, List[str]]

class CategorizationResult(BaseModel):
    predicted_category: str
    confidence_score: float

class MultiCategorizationResponse(BaseModel):
    # A resposta será um dicionário mapeando os nomes dos conjuntos para seus resultados
    results: Dict[str, CategorizationResult]
    
class SimilarityRequest(BaseModel):
    question: str
    paragraphs: list[str]

    
class RelevanceRequest(BaseModel):
    question: str
    context: str
class BooleanResponse(BaseModel):
    result: bool