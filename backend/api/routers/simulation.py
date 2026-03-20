from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.user import User
from backend.api.schemas.simulation import SimulationResponse, SimulationRequest

router = APIRouter(prefix="/simulation", tags=["Simulation"])

@router.post("/simulate_purchase", response_model=SimulationResponse)
def simulate_purchase(
        request: SimulationRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    monthly_cost = 0.0
    yearly_cost = 0.0

    if request.frequency.lower() == "monthly":
        monthly_cost = request.amount
        yearly_cost = request.amount * 12
    elif request.frequency.lower() == "weekly":
        monthly_cost = request.amount * 4.33
        yearly_cost = request.amount * 52
    elif request.frequency.lower() == "yearly":
        monthly_cost = request.amount / 12
        yearly_cost = request.amount
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid frequency. Use 'monthly' or 'weekly' or 'yearly'"
        )

    current_budget_limit = 1000.00

    remaining_budget = current_budget_limit - monthly_cost

    percent_of_budget = (monthly_cost / current_budget_limit) * 100

    if percent_of_budget >= 40:
        risk_level = "Risk"
    elif percent_of_budget >= 20:
        risk_level = "Moderate"
    else:
        risk_level = "Good"

    return {
        "projected_monthly_cost": round(monthly_cost, 2),
        "projected_yearly_cost": round(yearly_cost, 2),
        "current_monthly_budget": current_budget_limit,
        "remaining_budget_after_purchase": round(remaining_budget, 2),
        "risk_level": risk_level
    }