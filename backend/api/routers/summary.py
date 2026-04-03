from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.subscription import Subscription
from backend.api.models.user import User
from backend.api.schemas.summary import UnifiedIntelligenceSummary
from backend.api.services.intelligence_service import build_forecast_detail, build_health_score_detail

router = APIRouter(prefix="/summary", tags=["Summary"])


@router.get("", response_model=UnifiedIntelligenceSummary)
def get_unified_intelligence_summary(
        limit: int = Query(5, description="Number of items to return"),
        offset: int = Query(0, description="Pagination offset"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    health_data = build_health_score_detail(db, current_user.id)
    forecast_data = build_forecast_detail(db, current_user.id)

    total_subs = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.is_active == True,  # noqa: E712
    ).count()

    active_subs = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.is_active == True,  # noqa: E712
    ).offset(offset).limit(limit).all()

    formatted_subs = [{
        "id": sub.id,
        "merchant": sub.merchant,
        "amount": sub.amount,
        "frequency": sub.frequency,
        "is_duplicate": sub.is_duplicate,
        "transaction_ids": sub.transaction_id,
        "charge_count": len(sub.transaction_id or []),
        "first_charge_date": None,
        "last_charge_date": None,
        "average_interval_days": None,
    } for sub in active_subs]

    has_more = (offset + limit) < total_subs

    return UnifiedIntelligenceSummary(
        user_id=current_user.id,
        generated_at=datetime.now(timezone.utc).date(),
        health_score=health_data,
        forecast=forecast_data,
        active_subscriptions=formatted_subs,
        total_subscriptions_count=total_subs,
        has_more_subscriptions=has_more,
    )
