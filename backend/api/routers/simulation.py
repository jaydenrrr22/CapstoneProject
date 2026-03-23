from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.budget import Budget
from backend.api.models.transaction import Transaction
from backend.api.models.user import User
from backend.api.schemas.simulation import SimulationResponse, SimulationRequest
from datetime import datetime

router = APIRouter(prefix="/simulation", tags=["Simulation"])

@router.post("/simulate_purchase", response_model=SimulationResponse)
def simulate_purchase(
        request: SimulationRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    current_period = datetime.utcnow().strftime("%Y-%m")

    budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.period == current_period,
    ).first()

    if not budget:
        budget = db.query(Budget).filter(
            Budget.user_id == current_user.id,
        ).order_by(Budget.period.desc()).first()

    if not budget:
        raise HTTPException(
            status_code=404,
            detail="No budget found. Create a budget to simulate impact accurately.",
        )

    monthly_cost = 0.0
    yearly_cost = 0.0

    tx_type = (request.transaction_type or "spend").strip().lower()
    if tx_type not in {"spend", "deposit"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid transaction_type. Use 'spend' or 'deposit'",
        )

    sign = 1 if tx_type == "spend" else -1

    frequency = request.frequency.lower()

    if frequency == "one_time":
        monthly_cost = sign * request.amount
        yearly_cost = sign * request.amount
    elif frequency == "monthly":
        monthly_cost = sign * request.amount
        yearly_cost = sign * request.amount * 12
    elif frequency == "weekly":
        monthly_cost = sign * request.amount * 4.33
        yearly_cost = sign * request.amount * 52
    elif frequency == "yearly":
        monthly_cost = sign * request.amount / 12
        yearly_cost = sign * request.amount
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid frequency. Use 'one_time', 'monthly', 'weekly', or 'yearly'"
        )

    current_budget_limit = float(budget.amount)

    target_year, target_month = map(int, budget.period.split("-"))
    current_spent = db.query(func.sum(Transaction.cost)).filter(
        Transaction.user_id == current_user.id,
        extract("year", Transaction.date) == target_year,
        extract("month", Transaction.date) == target_month,
    ).scalar() or 0.0

    projected_monthly_spend = current_spent + monthly_cost

    remaining_budget = current_budget_limit - projected_monthly_spend

    current_percentage_used = (current_spent / current_budget_limit) * 100 if current_budget_limit > 0 else 0
    projected_percentage_used = (projected_monthly_spend / current_budget_limit) * 100 if current_budget_limit > 0 else 0

    if projected_percentage_used >= 90:
        risk_level = "Risk"
    elif projected_percentage_used >= 70:
        risk_level = "Moderate"
    else:
        risk_level = "Good"

    return {
        "projected_monthly_cost": round(monthly_cost, 2),
        "projected_yearly_cost": round(yearly_cost, 2),
        "current_monthly_budget": current_budget_limit,
        "current_spent_this_period": round(current_spent, 2),
        "projected_spent_this_period": round(projected_monthly_spend, 2),
        "current_percentage_used": round(current_percentage_used, 2),
        "projected_percentage_used": round(projected_percentage_used, 2),
        "remaining_budget_after_purchase": round(remaining_budget, 2),
        "risk_level": risk_level
    }