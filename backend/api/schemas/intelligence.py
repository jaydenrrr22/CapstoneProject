from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class IntelligenceProjectedImpact(BaseModel):
    balance_change: float
    budget_impact: float
    category_effect: str


class IntelligenceScenario(BaseModel):
    scenario_type: str
    projected_spent_this_period: float
    remaining_budget_after_purchase: float
    projected_percentage_used: float
    risk_level: str
    balance_change: float


class IntelligenceAnalysisDetails(BaseModel):
    analysis_type: str
    current_period: str
    action_date: Optional[date] = None
    merchant: Optional[str] = None
    category: Optional[str] = None
    budget_limit: float
    current_spent_this_period: float
    projected_spent_this_period: float
    current_percentage_used: float
    projected_percentage_used: float
    remaining_budget_after_purchase: float
    risk_level: str
    projected_monthly_spend_delta: float
    projected_yearly_spend_delta: float
    scenarios: List[IntelligenceScenario] = Field(default_factory=list)


class IntelligenceResponse(BaseModel):
    risk_score: float
    recommendation: str
    explanation: str
    projected_impact: IntelligenceProjectedImpact
    confidence: float
    timestamp: datetime
    details: Optional[IntelligenceAnalysisDetails] = None


class IntelligenceAnalyzeRequest(BaseModel):
    amount: float = Field(gt=0)
    action_date: Optional[date] = None
    category: Optional[str] = None
    merchant: Optional[str] = None
    transaction_type: str = "spend"
    frequency: str = "one_time"
    save_to_history: bool = False
    source: str = "intelligence.analyze"


class IntelligenceHistoryCreateRequest(IntelligenceResponse):
    source: str = "prediction.history"


class IntelligenceHistoryResponse(IntelligenceResponse):
    id: int
    source: str

    model_config = ConfigDict(from_attributes=True)
