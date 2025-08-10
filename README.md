
## ChatBotIA com Dashboard de administrador
## Tecnologias
HTML, TailwindCSS 3.14.7, JS, Python e PostgreSQL

## Funcionalidades Principais
-  Integração com IA: Utilizando o modelo llama3-8b-8192, com o Groq Cloud para geração de respostas RAG, intfloat/multilingual-e5-large para os embeddings de documentos, gemma2-9b-it para encontrar as palavras-chaves no texto e mDeBERTa-v3-base-mnli-xnli para categorização dos documentos.   

-  Autenticação Segura: Sistema de login com senhas criptografadas (bcryptjs) e autenticação com o sequelize-session através de cookies.

- Dashboard Interativo: Painel administrativo com gráficos (Chart.js) para visualização de métricas.

- Sistema de E-mails: Envio de e-mails transacionais (Nodemailer) para redefinição de senha.

- CRUD Completo: Gerenciamento de dados do operador, categorias e documentos através da API RESTful construída com Express e Sequelize.

- Frontend Responsivo: Interface de usuário construída com HTML, JavaScript puro e estilizada com TailwindCSS, garantindo um design responsivo e com modo escuro.


## Dependências

| Pacote/@ versão | Propósito |
| ------ | ------ |
|   autoprefixer@10.4.21     |   Adiciona prefixos de CSS para compatibilidade	     |
|    chart.js@4.5.2   |   Criação e renderização de gráficos	     |
|   postcss@8.5.2     |   Ferramenta para transformação de CSS     |
|    tailwindcss@3.4.17    |     Framework de estilização CSS   |
|     vite@6.3.2   |    Ferramenta de build e servidor de desenvolvimento local    |

			
| Pacote/@ versão | Propósito |
| ------ | ------ |
|    bcryptjs@3.0.2    |     Criptografia de senhas   |
|     body-parser@2.2.2   |   Middleware para análise de requisições     |		
|     cors@2.8.2   |      Habilitar o Cross-Origin Resource Sharing |
|     dotenv@16.5.2|   Gerenciamento de variáveis de ambiente (.env)     |		
|     express@5.1.2   |   Framework para criação de rotas e da API	     |		
|     node-fetch@3.3.2   |   Realizar requisições HTTP para a IA externa     |		
|    pg@8.16.0  |   Driver do PostgreSQL     |		
|    pgvector@0.2.1  |   Suporte a vetores para IA no PostgreSQL     |		
|    sequelize@6.37.7 |   ORM para interação com o banco de dados	     |	
|    connect-session-sequelize@8.0.0 |   gerenciamento de sessão	     |			
|    multer@2.0.2 |   Anexo de arquivos PDF e DOCX	     |		
|	pdf-parse-debugging-disabled@1.1.1 |	  Parsear o conteúdo de arquivos PDF           |	
|    mammoth@1.9.1  |   Converter arquivos .docx em HTML ou texto limpo     |		
|    ioredis@5.6.1  |  Cacheing do chat para respostas mais rápidas sem consultar a IA    |	
|    axios@1.10.0  |   Realizar requisições HTTP para APIs externas     |		
|    cookie-parser@1.4.7 |   Analisar cookies enviados pelo cliente     |	

| PIP | Propósito |
| ------ | ------ |
|   fastapi@0.115.13    |	Framework para criar APIs web de alta performance.	     |
|    uvicorn@0.35.0  |   Servidor web rápido para rodar aplicações Python assíncronas.	     |
|   python-multipart@0.0.20     |   Biblioteca para processar upload de arquivos (formulários multipart).     |
|    pydantic@2.11.7    |     Validação de dados e gerenciamento de configurações com type hints(utilizado também pelo FastAPI)   |


## Como Rodar o Projeto

Siga os passos abaixo para configurar e executar o projeto em seu ambiente local.

Pré-requisitos

    Node.js (versão 18 ou superior)

    NPM ou Yarn

    Uma instância do PostgreSQL em execução.



## BACKEND

    git clone https://github.com/pwaved/IAchatbot

    ` cd backend/ `
    
    ` npm install `

    Crie um arquivo .env na raiz da pasta /backend
    e preencha com suas credenciais, usando o .env.example como base
    
    ` cp .env.example .env `


## Configuração da variável de ambiente .env

    Configurações do Servidor
    SERVER_PORT=3000
    
    Credenciais do Banco de Dados (PostgreSQL)
    DB_HOST=localhost
    DB_USER=seu_usuario_postgres
    DB_PASSWORD=sua_senha_secreta
    DB_NAME=chatbotia_db
    DB_PORT=5432
    DB_DIALECT=postgres

    Credenciais para envio de E-mail (Nodemailer)
    EMAIL_HOST=smtp.example.com
    EMAIL_PORT=587
    BREVO_LOGIN=10c134501@smtp-brevo.com(exemplo)
    BREVO_API_KEY=sua_api_key_secreta

    Chave da API da IA
    AI_API_KEY=sua_chave_da_api_de_ia


## FRONTEND
    Em um novo terminal, navegue até a pasta do frontend
    ` cd frontend/ `

    Instale as dependências
    ` npm install autoprefixer@10.4.21 chart.js@4.5.0 postcss@8.5.6 tailwindcss@3.4.17 vite@6.3.5 `

    Inicie o servidor de desenvolvimento do Vite
    ` npm run dev `

## Python(BACKEND)
    Primeiro, abra um novo terminal e entre na pasta raiz do seu projeto Python.
    ` cd chatbotpy/ `
    É uma boa prática isolar as dependências do projeto criando uma variável de ambiente.
    
    python -m venv .venv

    `.\.venv\Scripts\Activate`
    após isso você verá : (.venv) no inicio de linha do seu terminal, 

    Há um arquivo txt com o nome de requirements.txt para os pips dentro da pasta chatbotpy:

    Instale pip `install -r requirements.txt`
    Rode ` uvicorn main:app --reload `

Após seguir os passos, o frontend estará acessível em http://localhost:5173 (ou outra porta indicada pelo Vite)o backend do node em http://localhost:3000 e o backend do python em http://127.0.0.1:8000.

## Author
Marlon

## Status
Finalizado