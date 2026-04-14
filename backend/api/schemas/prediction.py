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


class ChurnPredictionRequest(BaseModel):
    age: float
    gender: str
    months_subscribed: float
    usage_frequency: float
    support_calls: float
    payment_delays: float
    subscription_type: str
    contract_length: str
    total_spend: float
    days_since_last_interaction: float


class ChurnPredictionResponse(BaseModel):
    churn_risk: float
    confidence_score: float
    summary: str
