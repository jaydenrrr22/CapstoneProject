from typing import Optional

from pydantic import BaseModel, Field


class SimulationRequest(BaseModel):
    amount: float = Field(gt=0)
    category: Optional[str] = None
    transaction_type: str = "spend"
    frequency: str

class SimulationResponse(BaseModel):
    projected_monthly_cost: float
    projected_yearly_cost: float
    current_monthly_budget: float
    current_spent_this_period: float
    projected_spent_this_period: float
    current_percentage_used: float
    projected_percentage_used: float
    remaining_budget_after_purchase: float
    risk_level: str