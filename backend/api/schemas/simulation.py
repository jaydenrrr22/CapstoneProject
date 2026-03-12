from pydantic import BaseModel


class SimulationRequest(BaseModel):
    amount: int
    category: str
    frequency: str

class SimulationResponse(BaseModel):
    projected_monthly_cost: float
    projected_yearly_cost: float
    current_monthly_budget: float
    remaining_budget_after_purchase: float
    risk_level: str