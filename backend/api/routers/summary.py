from datetime import date, timezone, datetime

from fastapi import APIRouter, Query, Depends
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.budget import Budget
from backend.api.models.subscription import Subscription
from backend.api.models.transaction import Transaction
from backend.api.models.user import User
from backend.api.schemas.summary import HealthScoreDetail, ForecastDetail, UnifiedIntelligenceSummary

router = APIRouter(prefix="/summary", tags=["Summary"])

def calculate_health_score(db: Session, user_id: int) -> HealthScoreDetail:
    now = datetime.now(timezone.utc)
    current_period = f"{now.year}-{now.month:02d}"

    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.period == current_period,
    ).first()

    if not budget:
        return HealthScoreDetail(
            score=0,
            status= "Unknown",
            recommendation="No budget set for current month. Set up a budget to unlock your health score.",
        )

    total_spent = db.query(func.sum(Transaction.cost)).filter(
        Transaction.user_id == user_id,
        extract('year', Transaction.date) == now.year,
        extract('month', Transaction.date) == now.month,
    ).scalar()

    total_spent = total_spent or 0.0
    percentage_used = (total_spent / budget.amount) * 100 if budget.amount > 0 else 0

    if percentage_used >= 90:
        score = 40
        status = "Risk"
        rec = f"Warning: You have used {round(percentage_used, 1)}% of the budget."
    elif percentage_used >= 70:
        score = 70
        status = "Moderate"
        rec = "You are pacing normally, but watch your spending."
    else:
        score = 95
        status = "Good"
        rec = "Great Job! You are well under your budget limit."

    return HealthScoreDetail(
        score=score,
        status=status,
        recommendation=rec
    )

def calculate_forecast(db: Session, user_id: int) -> ForecastDetail:
    now = datetime.now(timezone.utc)
    current_period = f"{now.year}-{now.month:02d}"

    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.period == current_period,
    ).first()

    total_spent = db.query(func.sum(Transaction.cost)).filter(
        Transaction.user_id == user_id,
        extract('year', Transaction.date) == now.year,
        extract('month', Transaction.date) == now.month,
    ).scalar() or 0.0

    budget_amt = budget.amount if budget else 0.0
    expected_savings = max(0, budget_amt - total_spent)

    return ForecastDetail(
        predicted_spend=round(total_spent, 2),
        expected_savings=round(expected_savings, 2),
        confident_level=0.9,
        target_date=date.today()
    )

@router.get("", response_model=UnifiedIntelligenceSummary)
def get_unified_intelligence_summary(
        limit: int = Query(5, description="Number of items to return"),
        offset: int = Query(0, description="Pagination offset"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    health_data = calculate_health_score(db, current_user.id)
    forecast_data = calculate_forecast(db, current_user.id)

    total_subs = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.is_active == True
    ).count()

    active_subs = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.is_active == True
    ).offset(offset).limit(limit).all()

    formatted_subs = [{
        "id": sub.id,
        "merchant": sub.merchant,
        "amount": sub.amount,
        "frequency": sub.frequency,
        "is_duplicate": sub.is_duplicate,
        "transaction_ids": sub.transaction_id
    } for sub in active_subs]

    has_more = (offset + limit) < total_subs

    return UnifiedIntelligenceSummary(
        user_id = current_user.id,
        generated_at= datetime.now(timezone.utc).date(),
        health_score = health_data,
        forecast = forecast_data,
        active_subscriptions = formatted_subs,
        total_subscriptions_count=total_subs,
        has_more_subscriptions=has_more,
    )