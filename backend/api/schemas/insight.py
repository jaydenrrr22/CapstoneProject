from typing import List
from datetime import date
from pydantic import BaseModel


class CategoryTrend(BaseModel):
    category: str
    current_month_spent: float
    previous_month_spent: float
    percentage_change: float
    trend_direction: str # "UP", "DOWN", or "FLAT"

class CategoryTrendResponse(BaseModel):
    trends: List[CategoryTrend]

class AnomalyResponse(BaseModel):
    category: str
    merchant: str
    actual_amount: float
    expected_amount: float
    anomaly_type: str # "Spike" or "Unusual Activity"
    date: date