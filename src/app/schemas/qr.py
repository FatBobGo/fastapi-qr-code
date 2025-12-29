from pydantic import BaseModel, Field, HttpUrl
from typing import Optional


class QRRequest(BaseModel):
    url: str = Field(..., description="The URL or text to encode in the QR code")
    box_size: int = Field(
        default=10, ge=1, le=50, description="Size of each box in pixels"
    )
    border: int = Field(
        default=4, ge=0, le=20, description="Thickness of the border (boxes)"
    )
    fill_color: str = Field(default="black", description="Fill color of the QR code")
    back_color: str = Field(
        default="white", description="Background color of the QR code"
    )


class QRResponse(BaseModel):
    message: str
    qr_code_base64: Optional[str] = None
