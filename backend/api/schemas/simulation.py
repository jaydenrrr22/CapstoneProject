from typing import Optional, List

from pydantic import BaseModel, Field


class SimulationRequest(BaseModel):
    amount: float = Field(gt=0)
    category: Optional[str] = None
    transaction_type: str = "spend"
    frequency: str

class SimulationScenario(BaseModel):
    scenario_type: str
    projected_spent_this_period: float
    remaining_budget_after_purchase: float
    projected_percentage_used: float
    risk_level: str

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
    confidence_level: float
    recommendation: str
    scenarios: List[SimulationScenario]