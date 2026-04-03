import logging
import time

import boto3
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.api.cache import CACHE, CACHE_TTL
from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.dependencies.rate_limit import get_rate_limit_dependency
from backend.api.models.user import User
from backend.api.schemas.intelligence import IntelligenceAnalyzeRequest
from backend.api.services.intelligence_service import (
    analyze_transaction_decision,
    build_legacy_predict_response,
)

router = APIRouter(prefix="/predict", tags=["Prediction"])

logger = logging.getLogger("prediction")
cloudwatch = boto3.client("cloudwatch", region_name="us-east-2")


class PredictionRequest(BaseModel):
    amount: float
    category: str


@router.post(
    "/",
    deprecated=True,
)
def run_prediction(
    data: PredictionRequest,
    db: Session = Depends(get_db),
    _rate_limit: None = Depends(get_rate_limit_dependency(times=20, seconds=60)),
    _current_user: User = Depends(get_current_user),
):
    cache_key = f"{data.amount}:{data.category}"

    if cache_key in CACHE:
        entry = CACHE[cache_key]

        if time.time() - entry["timestamp"] < CACHE_TTL:
            logger.info("CACHE HIT")
            cloudwatch.put_metric_data(
                Namespace="Trace/Prediction",
                MetricData=[{
                    "MetricName": "PredictionCacheHit",
                    "Value": 1,
                    "Unit": "Count",
                }],
            )
            return entry["response"]

        logger.info("CACHE EXPIRED")
        del CACHE[cache_key]

    logger.info("CACHE MISS")
    cloudwatch.put_metric_data(
        Namespace="Trace/Prediction",
        MetricData=[{
            "MetricName": "PredictionCacheMiss",
            "Value": 1,
            "Unit": "Count",
        }],
    )

    start_time = time.time()
    analysis = analyze_transaction_decision(
        db=db,
        user_id=_current_user.id,
        request=IntelligenceAnalyzeRequest(
            amount=data.amount,
            category=data.category,
            transaction_type="spend",
            frequency="one_time",
            save_to_history=False,
            source="predict",
        ),
    )
    latency = time.time() - start_time

    response = build_legacy_predict_response(
        analysis,
        latency=latency,
        cached=False,
    )

    CACHE[cache_key] = {
        "response": response,
        "timestamp": time.time(),
    }

    cloudwatch.put_metric_data(
        Namespace="Trace/Prediction",
        MetricData=[
            {"MetricName": "PredictionRequests", "Value": 1, "Unit": "Count"},
            {"MetricName": "PredictionLatency", "Value": latency, "Unit": "Seconds"},
            {"MetricName": "PredictionConfidence", "Value": analysis.risk_score, "Unit": "None"},
        ],
    )

    logger.info("Prediction result generated")
    return response
