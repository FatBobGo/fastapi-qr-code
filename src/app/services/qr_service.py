import qrcode
import io
from src.app.schemas.qr import QRRequest
from src.app.core.logging import get_logger

logger = get_logger(__name__)


def generate_qr_code(request: QRRequest) -> io.BytesIO:
    """
    Generates a QR code image based on the request parameters.
    Returns a BytesIO object containing the image data.

    Args:
        request.url: The URL or data to encode in the QR code.
        request.box_size: Size of each box in the QR code grid.
        request.border: Border size around the QR code.
        request.fill_color: Color of the QR code modules.
        request.back_color: Background color of the QR code.
    """
    logger.info(f"Generating QR code for content: {request.url[:5]}**hidden**")

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=request.box_size,
        border=request.border,
    )
    qr.add_data(request.url)
    qr.make(fit=True)

    img = qr.make_image(fill_color=request.fill_color, back_color=request.back_color)

    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)

    logger.info("QR code generated successfully")
    return img_byte_arr
