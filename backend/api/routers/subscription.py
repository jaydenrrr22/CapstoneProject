from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import asc
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.transaction import Transaction
from backend.api.models.user import User
from backend.api.schemas.subscription import SubscriptionDetectionResponse

router = APIRouter(prefix="/subscription", tags=["Subscription"])

@router.get("/detect", response_model=List[SubscriptionDetectionResponse])
def detect_subscriptions(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    transactions = (db.query(Transaction)
                    .filter(Transaction.user_id == current_user.id)
                    .order_by(asc(Transaction.date))
                    .all())

    grouped_tx = defaultdict(list)
    for tx in transactions:
        key = (tx.store_name.lower(), tx.cost)
        grouped_tx[key].append(tx)

    detected_subscriptions = []

    for (merchant, cost), tx_list in grouped_tx.items():
        if len(tx_list) < 2:
            continue

        is_monthly = True
        is_duplicate = False
        tx_ids = [tx_list[0].id]

        for i in range(1, len(tx_list)):
            days_diff = (tx_list[i].date - tx_list[i-1].date).days
            tx_ids.append(tx_list[i].id)

            if days_diff <= 3:
                is_duplicate = True

            elif not (25 <= days_diff <= 35):
                is_monthly = False

        if is_monthly or is_duplicate:
            detected_subscriptions.append({
                "merchant": merchant.capitalize(),
                "amount": cost,
                "frequency": "monthly" if is_monthly else "Unknown",
                "is_duplicate": is_duplicate,
                "transaction_ids": tx_ids,
            })

    return detected_subscriptions