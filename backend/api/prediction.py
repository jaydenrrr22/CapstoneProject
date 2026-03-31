from fastapi import APIRouter, Depends
from pydantic import BaseModel
from backend.api.cache import CACHE, CACHE_TTL
from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.rate_limit import get_rate_limit_dependency
from backend.api.models.user import User
import random
import logging
import time
import boto3

router = APIRouter(prefix="/predict", tags=["Prediction"])

logger = logging.getLogger("prediction")

# CloudWatch client
cloudwatch = boto3.client("cloudwatch", region_name="us-east-2")

class PredictionRequest(BaseModel):
    amount: float
    category: str


# ---------------- CACHE CONFIG ----------------
@router.post("/")
def run_prediction(
    data: PredictionRequest,
    _rate_limit: None = Depends(get_rate_limit_dependency(times=20, seconds=60)),
    _current_user: User = Depends(get_current_user)
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
                    "Unit": "Count"
                }]
            )

            return {**entry["response"], "cached": True}

        else:
            logger.info("CACHE EXPIRED")
            del CACHE[cache_key]

    logger.info("CACHE MISS")

    cloudwatch.put_metric_data(
        Namespace="Trace/Prediction",
        MetricData=[{
            "MetricName": "PredictionCacheMiss",
            "Value": 1,
            "Unit": "Count"
        }]
    )

    start_time = time.time()

    try:
        logger.info(f"Prediction requested")

        risk_score = random.uniform(0, 1)

        latency = time.time() - start_time

        response = {
            "risk_score": risk_score,
            "message": "Prediction executed successfully",
            "latency": latency
        }

        CACHE[cache_key] = {
            "response": response,
            "timestamp": time.time()
        }

        cloudwatch.put_metric_data(
            Namespace="Trace/Prediction",
            MetricData=[
                {"MetricName": "PredictionRequests", "Value": 1, "Unit": "Count"},
                {"MetricName": "PredictionLatency", "Value": latency, "Unit": "Seconds"},
                {"MetricName": "PredictionConfidence", "Value": risk_score, "Unit": "None"}
            ]
        )

        logger.info(f"Prediction result: {risk_score}")

        return {**response, "cached": False}

    except Exception as e:

        cloudwatch.put_metric_data(
            Namespace="Trace/Prediction",
            MetricData=[{
                "MetricName": "PredictionErrors",
                "Value": 1,
                "Unit": "Count"
            }]
        )

        logger.exception("Prediction failure")

        raise
