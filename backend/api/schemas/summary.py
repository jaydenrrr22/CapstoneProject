from datetime import date
from typing import List
from pydantic import BaseModel
from backend.api.schemas.subscription import SubscriptionDetectionResponse

class HealthScoreDetail(BaseModel):
    score: int
    status: str
    recommendation: str

class ForecastDetail(BaseModel):
    predicted_spend: float
    expected_savings: float
    confident_level: float
    target_date: date

class UnifiedIntelligenceSummary(BaseModel):
    user_id: int
    generated_at: date
    health_score: HealthScoreDetail
    forecast: ForecastDetail
    active_subscriptions: List[SubscriptionDetectionResponse]
    total_subscriptions_count: int
    has_more_subscriptions: bool