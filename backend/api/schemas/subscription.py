from typing import List

from pydantic import BaseModel

class SubscriptionDetectionResponse(BaseModel):
    id: int
    merchant: str
    amount: float
    frequency: str
    is_duplicate: bool
    transaction_ids: List[int]

    class Config:
        from_attributes = True