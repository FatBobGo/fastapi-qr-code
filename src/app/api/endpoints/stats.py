from fastapi import APIRouter
from src.app.services.stats_service import get_qr_count

router = APIRouter()


@router.get("/", response_model=dict)
def read_stats():
    count = get_qr_count()
    return {"total_qr_generated": count}
