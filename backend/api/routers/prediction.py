from datetime import timezone, datetime, timedelta
from typing import List

from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from starlette import status

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.prediction import PredictionResult
from backend.api.models.user import User
from backend.api.schemas.prediction import PredictionResponse, PredictionCreateResponse

router = APIRouter(prefix="/prediction", tags=["Prediction"])

@router.get("/history", response_model=List[PredictionResponse])
def get_prediction_history(
        limit: int = Query(12, description="The number of predictions to return"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    history = db.query(PredictionResult).filter(
        PredictionResult.user_id == current_user.id,
    ).order_by(PredictionResult.created_at.desc()).limit(limit).all()

    return history

@router.post("/history", response_model=PredictionCreateResponse, status_code=status.HTTP_201_CREATED)
def create_prediction_history(
        request: PredictionCreateResponse,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    new_prediction = PredictionResult(
        user_id=current_user.id,
        target_data=request.target_data,
        predicted_spending=request.predicted_spending,
        expected_savings=request.expected_savings,
        confidence_level=request.confidence_level,
    )
    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)
    return new_prediction

@router.delete("/history")
def delete_prediction_history(
        days_to_keep: int = Query(90, description="Number of days to keep prediction history"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_to_keep)

    deleted_count = db.query(PredictionResult).filter(
        PredictionResult.user_id == current_user.id,
        PredictionResult.created_at < cutoff_date,
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "message": "Prediction history deleted",
        "deleted_count": deleted_count
    }