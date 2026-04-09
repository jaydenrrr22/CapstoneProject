from datetime import date
from typing import List, Union

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from starlette import status

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.user import User
from backend.api.schemas.intelligence import (
    IntelligenceHistoryCreateRequest,
    IntelligenceHistoryResponse,
    IntelligenceResponse,
)
from backend.api.schemas.prediction import PredictionCreateResponse
from backend.api.services.intelligence_service import (
    build_legacy_history_analysis,
    delete_history_records,
    list_history_records,
    save_history_record,
)

from collections import defaultdict
from time import time

REQUEST_TRACKER = defaultdict(list)
REQUEST_LIMIT = 20
REQUEST_WINDOW = 10  # seconds

router = APIRouter(prefix="/prediction", tags=["Prediction"])

PredictionHistoryCreatePayload = Union[IntelligenceHistoryCreateRequest, PredictionCreateResponse]


@router.get("/history", response_model=List[IntelligenceHistoryResponse])
def get_prediction_history(
        limit: int = Query(12, description="The number of history items to return"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    return list_history_records(db=db, user_id=current_user.id, limit=limit)


@router.post(
    "/history",
    response_model=IntelligenceHistoryResponse,
    status_code=status.HTTP_201_CREATED,
    deprecated=True,
)
def create_prediction_history(
        request: PredictionHistoryCreatePayload,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if isinstance(request, PredictionCreateResponse):
        analysis = build_legacy_history_analysis(
            target_date=request.target_data if isinstance(request.target_data, date) else None,
            predicted_spending=request.predicted_spending,
            expected_savings=request.expected_savings,
            confidence_level=request.confidence_level,
        )
        source = "prediction.history.legacy"
    else:
        analysis = IntelligenceResponse.model_validate(request.model_dump())
        source = request.source

    return save_history_record(
        db=db,
        user_id=current_user.id,
        analysis=analysis,
        source=source,
    )


@router.delete("/history")
def delete_prediction_history(
        days_to_keep: int = Query(90, description="Number of days to keep prediction history"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    deleted_count = delete_history_records(
        db=db,
        user_id=current_user.id,
        days_to_keep=days_to_keep,
    )

    return {
        "message": "Prediction history deleted",
        "deleted_count": deleted_count,
    }
