from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.budget import Budget
from backend.api.models.transaction import Transaction
from backend.api.models.user import User
from backend.api.schemas.analytics import FinancialHealthResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/financial-health/{period}", response_model=FinancialHealthResponse)
def get_financial_health(
    period: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.period == period,
    ).first()

    if not budget:
        raise HTTPException(status_code=404, detail=f"No budget found for period {period}")

    try:
        target_year, target_month = map(int, period.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Period must be in the format YYYY-MM")

    total_spent = db.query(func.sum(Transaction.cost)).filter(
        Transaction.user_id == current_user.id,
        extract("year", Transaction.date) == target_year,
        extract("month", Transaction.date) == target_month,
    ).scalar()

    total_spent = total_spent or 0.0

    remaining_balance = budget.amount - total_spent
    percentage_used = (total_spent / budget.amount) * 100 if budget.amount > 0 else 0

    # financial health score:
    # lower percentage used = better score
    raw_score = 100 - percentage_used
    score = max(0, min(100, int(round(raw_score))))

    if score >= 70:
        status = "Good"
    elif score >= 40:
        status = "Moderate"
    else:
        status = "Risk"

    return {
        "period": period,
        "score": score,
        "budget_limit": round(budget.amount, 2),
        "total_spent": round(total_spent, 2),
        "remaining_balance": round(remaining_balance, 2),
        "percentage_used": round(percentage_used, 2),
        "status": status,
    }