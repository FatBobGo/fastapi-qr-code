from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from src.app.schemas.qr import QRRequest
from src.app.services.qr_service import generate_qr_code
from src.app.services.stats_service import increment_qr_count
from src.app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post(
    "/generate",
    responses={200: {"content": {"image/png": {}}}},
    description="Generate a QR code image",
)
async def create_qr_code(request: QRRequest):
    try:
        logger.info(f"Received QR generation request for: {request.url}")
        img_bytes = generate_qr_code(request)

        # Increment usage stats
        increment_qr_count()

        return Response(content=img_bytes.getvalue(), media_type="image/png")
    except Exception as e:
        logger.error(f"Error generating QR code: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not generate QR code")
