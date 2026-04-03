from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.user import User
from backend.api.schemas.intelligence import IntelligenceAnalyzeRequest, IntelligenceResponse
from backend.api.services.intelligence_service import analyze_transaction_decision

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])


@router.post("/analyze", response_model=IntelligenceResponse)
def analyze_intelligence(
        request: IntelligenceAnalyzeRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    return analyze_transaction_decision(
        db=db,
        user_id=current_user.id,
        request=request,
    )
