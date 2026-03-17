from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional

class TransactionBase(BaseModel):
    cost: float
    date: date
    store_name: str
    category: Optional[str] = None

class TransactionCreate(TransactionBase):
    cost: float
    date: date
    store_name: str

class TransactionResponse(TransactionBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)