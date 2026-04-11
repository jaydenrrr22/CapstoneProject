from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import asc
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.subscription import Subscription
from backend.api.models.transaction import Transaction
from backend.api.models.user import User
from backend.api.schemas.subscription import SubscriptionDetectionResponse
from backend.api.services.finance_logic import expense_amount

router = APIRouter(prefix="/subscription", tags=["Subscription"])


@router.get("/detect", response_model=List[SubscriptionDetectionResponse])
def detect_subscriptions(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(asc(Transaction.date))
        .all()
    )

    grouped_tx = defaultdict(list)
    for tx in transactions:
        normalized_cost = expense_amount(tx.cost, tx.category)
        if normalized_cost <= 0:
            continue
        key = (tx.store_name.lower(), normalized_cost)
        grouped_tx[key].append(tx)

    detected_subscriptions = []

    existing_subs = db.query(Subscription).filter(Subscription.user_id == current_user.id).all()

    sub_lookup = {(sub.merchant.lower(), sub.amount): sub.id for sub in existing_subs}

    new_subs_to_add = []

    for (merchant, cost), tx_list in grouped_tx.items():
        if len(tx_list) < 2:
            continue

        is_monthly = True
        is_duplicate = False
        tx_ids = [tx_list[0].id]
        total_interval_days = 0
        interval_count = 0

        for i in range(1, len(tx_list)):
            days_diff = (tx_list[i].date - tx_list[i - 1].date).days
            tx_ids.append(tx_list[i].id)
            total_interval_days += days_diff
            interval_count += 1

            if days_diff <= 3:
                is_duplicate = True
            elif not (25 <= days_diff <= 35):
                is_monthly = False

        if is_monthly or is_duplicate:
            frequency_val = "monthly" if is_monthly else "Unknown"
            merchant_name = merchant.capitalize()

            lookup_key = (merchant.lower(), cost)

            if lookup_key in sub_lookup:
                sub_id = sub_lookup[lookup_key]
            else:
                new_sub = Subscription(
                    user_id=current_user.id,
                    merchant=merchant_name,
                    amount=cost,
                    frequency=frequency_val,
                    is_duplicate=is_duplicate,
                    transaction_id=tx_ids,
                )
                new_subs_to_add.append(new_sub)
                sub_id = None

            detected_subscriptions.append({
                "id": sub_id,
                "merchant": merchant_name,
                "amount": cost,
                "frequency": frequency_val,
                "is_duplicate": is_duplicate,
                "charge_count": len(tx_ids),
                "first_charge_date": tx_list[0].date,
                "last_charge_date": tx_list[-1].date,
                "average_interval_days": round(total_interval_days / interval_count) if interval_count > 0 else None,
                "transaction_ids": tx_ids,
                "new_sub_ref": new_sub if lookup_key not in sub_lookup else None
            })
    if new_subs_to_add:
        db.add_all(new_subs_to_add)
        db.commit()

        for sub_dict in detected_subscriptions:
            if sub_dict.get("new_sub_ref"):
                sub_dict["id"] = sub_dict["new_sub_ref"].id
            sub_dict.pop("new_sub_ref", None)

    already_detected_ids = {
        tx_id
        for subscription in detected_subscriptions
        for tx_id in subscription["transaction_ids"]
    }

    new_marked_subs = []

    for tx in transactions:
        category = (tx.category or "").strip().lower()

        if tx.id in already_detected_ids:
            continue
        normalized_cost = expense_amount(tx.cost, tx.category)

        if normalized_cost <= 0:
            continue
        if "subscription" not in category:
            continue

        merchant_name = tx.store_name.strip().title()
        lookup_key = (merchant_name.lower(), normalized_cost)

        if lookup_key in sub_lookup:
            sub_id = sub_lookup[lookup_key]
        else:
            new_sub = Subscription(
                user_id=current_user.id,
                merchant=merchant_name,
                amount=normalized_cost,
                frequency="Marked",
                is_duplicate=False,
                transaction_id=[tx.id]
            )
            new_marked_subs.append(new_sub)
            sub_id = None

            detected_subscriptions.append({
                "id": sub_id,
                "merchant": merchant_name,
                "amount": normalized_cost,
                "frequency": "Marked",
                "is_duplicate": False,
                "charge_count": 1,
                "first_charge_date": tx.date,
                "last_charge_date": tx.date,
                "average_interval_days": None,
                "transaction_ids": [tx.id],
                "new_sub_ref": new_sub if lookup_key not in sub_lookup else None
            })

    if new_marked_subs:
        db.add_all(new_marked_subs)
        db.commit()

        for sub_dict in detected_subscriptions:
            if sub_dict.get("new_sub_ref"):
                sub_dict["id"] = sub_dict["new_sub_ref"].id
            sub_dict.pop("new_sub_ref", None)

    return detected_subscriptions
