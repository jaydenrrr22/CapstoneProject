from pydantic import BaseModel, ConfigDict
from datetime import date

class TransactionBase(BaseModel):
    cost: float
    date: date
    store_name: str
    category: str

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)