from datetime import datetime, date

from pydantic import BaseModel


class PredictionResponse(BaseModel):
    id: int
    created_at: datetime
    target_data: date
    predicted_spending: float
    expected_savings: float
    confidence_level: float

    class Config:
        from_attributes = True

class PredictionCreateResponse(BaseModel):
    target_data: date
    predicted_spending: float
    expected_savings: float
    confidence_level: float