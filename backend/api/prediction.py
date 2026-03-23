from fastapi import APIRouter
from pydantic import BaseModel
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
CACHE = {}
CACHE_TTL = 60  # seconds


@router.post("/")
def run_prediction(data: PredictionRequest):

    cache_key = f"{data.amount}:{data.category}"

    # ---------- CACHE CHECK ----------
    if cache_key in CACHE:
        entry = CACHE[cache_key]

        if time.time() - entry["timestamp"] < CACHE_TTL:
            logger.info("CACHE HIT")

            cloudwatch.put_metric_data(
                Namespace="Trace/Prediction",
                MetricData=[
                    {
                        "MetricName": "PredictionCacheHit",
                        "Value": 1,
                        "Unit": "Count"
                    }
                ]
            )

            return {
                **entry["response"],
                "cached": True
            }

        else:
            logger.info("CACHE EXPIRED")
            del CACHE[cache_key]

    logger.info("CACHE MISS")

    cloudwatch.put_metric_data(
        Namespace="Trace/Prediction",
        MetricData=[
            {
                "MetricName": "PredictionCacheMiss",
                "Value": 1,
                "Unit": "Count"
            }
        ]
    )

    start_time = time.time()

    try:
        logger.info(f"Prediction requested: {data}")

        # fake ML logic for now
        risk_score = random.uniform(0, 1)

        latency = time.time() - start_time

        response = {
            "risk_score": risk_score,
            "message": "Prediction executed successfully",
            "latency": latency
        }

        # -------- STORE IN CACHE --------
        CACHE[cache_key] = {
            "response": response,
            "timestamp": time.time()
        }

        # -------- CloudWatch Metrics (ONLY ON REAL EXECUTION) --------

        cloudwatch.put_metric_data(
            Namespace="Trace/Prediction",
            MetricData=[
                {
                    "MetricName": "PredictionRequests",
                    "Value": 1,
                    "Unit": "Count"
                },
                {
                    "MetricName": "PredictionLatency",
                    "Value": latency,
                    "Unit": "Seconds"
                },
                {
                    "MetricName": "PredictionConfidence",
                    "Value": risk_score,
                    "Unit": "None"
                }
            ]
        )

        logger.info(f"Prediction result: {risk_score}")

        return {
            **response,
            "cached": False
        }

    except Exception as e:

        cloudwatch.put_metric_data(
            Namespace="Trace/Prediction",
            MetricData=[
                {
                    "MetricName": "PredictionErrors",
                    "Value": 1,
                    "Unit": "Count"
                }
            ]
        )

        logger.error(f"Prediction failure: {str(e)}")

        raise e
