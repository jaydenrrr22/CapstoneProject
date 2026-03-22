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


@router.post("/")
def run_prediction(data: PredictionRequest):

    start_time = time.time()

    try:
        logger.info(f"Prediction requested: {data}")

        # fake ML logic for now
        risk_score = random.uniform(0, 1)

        latency = time.time() - start_time

        # -------- CloudWatch Metrics --------

        # Request count
        cloudwatch.put_metric_data(
            Namespace="Trace/Prediction",
            MetricData=[
                {
                    "MetricName": "PredictionRequests",
                    "Value": 1,
                    "Unit": "Count"
                }
            ]
        )

        # Latency
        cloudwatch.put_metric_data(
            Namespace="Trace/Prediction",
            MetricData=[
                {
                    "MetricName": "PredictionLatency",
                    "Value": latency,
                    "Unit": "Seconds"
                }
            ]
        )

        # Confidence / Risk Score
        cloudwatch.put_metric_data(
            Namespace="Trace/Prediction",
            MetricData=[
                {
                    "MetricName": "PredictionConfidence",
                    "Value": risk_score,
                    "Unit": "None"
                }
            ]
        )

        logger.info(f"Prediction result: {risk_score}")

        return {
            "risk_score": risk_score,
            "message": "Prediction executed successfully"
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
