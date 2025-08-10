from fastapi import FastAPI
from api.endpoints import router as api_router

app = FastAPI(
    title="ChatBotQQ",
    version="1.0.0"
)


app.include_router(api_router)

@app.get("/")
def read_root():
    return {"status": "Serviço de IA online"}