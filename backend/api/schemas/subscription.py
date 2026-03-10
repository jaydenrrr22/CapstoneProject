from typing import List

from pydantic import BaseModel

class SubscriptionDetectionResponse(BaseModel):
    merchant: str
    amount: float
    frequency: str
    is_duplicate: bool
    transaction_ids: List[int]