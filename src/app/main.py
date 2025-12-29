from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from src.app.core.config import get_settings
from src.app.api.endpoints import qr, stats
from src.app.core.database import init_db
import os

from contextlib import asynccontextmanager

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown (if needed)


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)


# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.include_router(qr.router, prefix="/qr", tags=["QR Code"])
app.include_router(stats.router, prefix="/stats", tags=["Statistics"])


@app.get("/")
async def read_root():
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Frontend not found"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
