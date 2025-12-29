from fastapi import FastAPI
from src.app.core.config import get_settings
from src.app.api.endpoints import qr

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.include_router(qr.router, prefix="/qr", tags=["QR Code"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
