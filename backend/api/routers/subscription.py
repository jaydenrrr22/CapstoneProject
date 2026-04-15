from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.user import User
from backend.api.schemas.subscription import SubscriptionDetectionResponse
from backend.api.services.subscription_service import sync_user_subscriptions

router = APIRouter(prefix="/subscription", tags=["Subscription"])


@router.get("/detect", response_model=List[SubscriptionDetectionResponse])
def detect_subscriptions(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    return sync_user_subscriptions(db, current_user.id)
