from typing import Dict, Optional

from pydantic import BaseModel


class ReceiptStatusUpdate(BaseModel):
    receipt_id: str
    new_status: str


class ReceiptUpdate(BaseModel):
    receipt_status: Optional[str] = None
    textract_data: Optional[Dict[str, str]] = None
