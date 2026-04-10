from datetime import date
from typing import List, Optional

from pydantic import BaseModel

class SubscriptionDetectionResponse(BaseModel):
    id: int
    merchant: str
    amount: float
    frequency: str
    is_duplicate: bool
    transaction_ids: List[int]
    charge_count: int
    first_charge_date: Optional[date] = None
    last_charge_date: Optional[date] = None
    average_interval_days: Optional[int] = None

    class Config:
        from_attributes = True
