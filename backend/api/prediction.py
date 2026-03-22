from fastapi import APIRouter
from pydantic import BaseModel
import random
import logging

router = APIRouter(prefix="/predict", tags=["Prediction"])

logger = logging.getLogger("prediction")

class PredictionRequest(BaseModel):
    amount: float
    category: str

@router.post("/")
def run_prediction(data: PredictionRequest):
    logger.info(f"Prediction requested: {data}")

    # fake ML logic for now
    risk_score = random.uniform(0, 1)

    logger.info(f"Prediction result: {risk_score}")

    return {
        "risk_score": risk_score,
        "message": "Prediction executed successfully"
    }
