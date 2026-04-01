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

    monthly_transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        extract("year", Transaction.date) == target_year,
        extract("month", Transaction.date) == target_month,
    )

    total_spent = monthly_transactions.with_entities(
        func.sum(Transaction.cost)
    ).scalar() or 0.0

    subscription_total = monthly_transactions.filter(
        Transaction.category.ilike("Subscription%")
    ).with_entities(
        func.sum(Transaction.cost)
    ).scalar() or 0.0


    adjusted_spent = total_spent

    remaining_balance = budget.amount - adjusted_spent
    percentage_used = (adjusted_spent / budget.amount) * 100 if budget.amount > 0 else 0

    # TODO (Future):
    # When dedicated Subscription records are fully implemented,
    # replace category-based subscription detection with the real
    # subscription table / endpoint and decide whether to:
    # - include subscription cost directly in spending
    # - apply an additional recurring-burden penalty
    # - blend in prediction/ML-based scoring

    raw_score = 100 - percentage_used

    
    if budget.amount > 0:
        subscription_ratio = (subscription_total / budget.amount) * 100
        raw_score -= subscription_ratio * 0.15

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
        "total_spent": round(adjusted_spent, 2),
        "remaining_balance": round(remaining_balance, 2),
        "percentage_used": round(percentage_used, 2),
        "status": status,
    }