from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.user import User
from backend.api.schemas.analytics import FinancialHealthResponse
from backend.api.services.intelligence_service import calculate_financial_health

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/financial-health/{period}", response_model=FinancialHealthResponse)
def get_financial_health(
    period: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return calculate_financial_health(
        db=db,
        user_id=current_user.id,
        period=period,
    )
