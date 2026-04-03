import math
from collections import defaultdict
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.insight import AnomalyResult
from backend.api.models.transaction import Transaction
from backend.api.models.user import User
from backend.api.schemas.insight import CategoryTrendResponse, AnomalyResponse

router = APIRouter(prefix="/insight", tags=["Insight"])

@router.get("/category-trends", response_model=CategoryTrendResponse)
def get_category_trends(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    current_month = now.month
    current_year = now.year

    if current_month == 1:
        previous_month = 12
        previous_year = current_year - 1

    else:
        previous_month = current_month - 1
        previous_year = current_year

    current_spending = db.query(Transaction.category,
                                func.sum(Transaction.cost).label("total")
                                ).filter(
        Transaction.user_id == current_user.id,
        extract('month', Transaction.date) == (current_month),
        extract('year', Transaction.date) == (current_year)
    ).group_by(Transaction.category).all()

    previous_spending = db.query(Transaction.category,
                                 func.sum(Transaction.cost).label("total")
                                 ).filter(
        Transaction.user_id == current_user.id,
        extract('month', Transaction.date) == (previous_month),
        extract('year', Transaction.date) == (previous_year)
    ).group_by(Transaction.category).all()

    current_dict = {cat: float(total) for cat, total in current_spending}
    previous_dict = {cat: float(total) for cat, total in previous_spending}

    trends = []

    all_categories = set(current_dict.keys()).union(set(previous_dict.keys()))

    for category in all_categories:
        current_amt = current_dict.get(category, 0.0)
        previous_amt = previous_dict.get(category, 0.0)

        if previous_amt == 0:
            pct_change = 100.0 if current_amt > 0 else 0.0
        else:
            pct_change = ((current_amt - previous_amt) / previous_amt) * 100.0

        if current_amt > previous_amt:
            direction = "Spending more"
        elif current_amt < previous_amt:
            direction = "Spending less"
        else:
            direction = "FLAT"

        trends.append({
            "category": category,
            "current_month_spent": round(current_amt, 2),
            "previous_month_spent": round(previous_amt, 2),
            "percentage_change": round(pct_change, 1),
            "trend_direction": direction,
        })

    return {"trends": trends}

@router.get("/anomalies", response_model=List[AnomalyResponse])
def detect_spending_anomalies(db: Session = Depends(get_db),
                              current_user: User = Depends(get_current_user)):
    Z_SCORE_THRESHOLD = 1.3

    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
    ).all()

    merchant_cost = defaultdict(list)

    for transaction in transactions:
        normalized_store = transaction.store_name.strip().lower()
        merchant_cost[normalized_store].append(transaction.cost)

    category_stats = {}
    for category, costs in merchant_cost.items():
        if len(costs) < 3:
            continue

        mean = sum(costs) / len(costs)
        variance = sum([((x-mean)**2) for x in costs]) / len(costs)
        std_dev = math.sqrt(variance)

        category_stats[category] = {"mean": mean, "std_dev": std_dev}

    anomalies = []

    existing_anomalies = db.query(AnomalyResult).filter(
        AnomalyResult.user_id == current_user.id
    ).all()
    anomaly_tx_ids = {a.transaction_id for a in existing_anomalies}

    new_anomalies_to_add = []

    for transaction in transactions:
        normalize_store = transaction.store_name.strip().lower()
        all_costs = merchant_cost[normalize_store]

        if len(all_costs) < 4:
            continue

        other_costs = all_costs.copy()
        other_costs.remove(transaction.cost)

        clean_mean = sum(other_costs) / len(other_costs)
        variance = sum([((x-clean_mean)**2) for x in other_costs]) / len(other_costs)
        clean_std_dev = math.sqrt(variance)

        if clean_std_dev == 0.0:
            continue

        z_score = (transaction.cost - clean_mean) / clean_std_dev

        if z_score > 2.5 and transaction.cost >= 50 and transaction.cost > clean_mean:

            if transaction.id not in anomaly_tx_ids:
                new_anomaly = AnomalyResult(
                    user_id=current_user.id,
                    transaction_id=transaction.id,
                    category=transaction.category,
                    merchant=transaction.store_name,
                    actual_amount=round(transaction.cost, 2),
                    expected_amount=round(clean_mean, 2),
                    anomaly_type="Spike",
                    created_at=transaction.date
                )
                new_anomalies_to_add.append(new_anomaly)
                anomaly_tx_ids.add(transaction.id)

            anomalies.append({
                "category": transaction.category,
                "merchant": transaction.store_name,
                "actual_amount": round(transaction.cost, 2),
                "expected_amount": round(clean_mean, 2),
                "anomaly_type": "Spike",
                "date": transaction.date,
            })

    if new_anomalies_to_add:
        db.add_all(new_anomalies_to_add)
        db.commit()

    return anomalies