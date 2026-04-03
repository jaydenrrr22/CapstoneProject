from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.user import User
from backend.api.schemas.insight import AnomalyResponse, CategoryTrendResponse
from backend.api.services.intelligence_service import calculate_category_trends, detect_spending_anomalies

router = APIRouter(prefix="/insight", tags=["Insight"])


@router.get("/category-trends", response_model=CategoryTrendResponse)
def get_category_trends(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    return calculate_category_trends(db=db, user_id=current_user.id)


@router.get("/anomalies", response_model=List[AnomalyResponse])
def get_spending_anomalies(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    return detect_spending_anomalies(db=db, user_id=current_user.id)
