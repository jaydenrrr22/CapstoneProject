from __future__ import annotations

from collections import defaultdict
from typing import Any, Optional

from sqlalchemy import asc
from sqlalchemy.orm import Session

from backend.api.models.subscription import Subscription
from backend.api.models.transaction import Transaction
from backend.api.services.finance_logic import expense_amount, is_subscription_category


def _normalize_merchant(value: Any) -> str:
    return str(value or "").strip().lower()


def _display_merchant(value: Any) -> str:
    merchant = str(value or "").strip()
    return merchant.title() if merchant else "Subscription"


def _normalize_amount(value: Any) -> float:
    try:
        numeric_value = float(value or 0.0)
    except (TypeError, ValueError):
        return 0.0

    return round(numeric_value, 2)


def _subscription_lookup_key(merchant: Any, amount: Any) -> tuple[str, float]:
    return _normalize_merchant(merchant), _normalize_amount(amount)


def _sorted_transaction_ids(transactions: list[Transaction]) -> list[int]:
    return [transaction.id for transaction in sorted(transactions, key=lambda item: (item.date, item.id))]


def _average_interval_days(transactions: list[Transaction]) -> Optional[int]:
    if len(transactions) < 2:
        return None

    intervals = [
        (transactions[index].date - transactions[index - 1].date).days
        for index in range(1, len(transactions))
    ]

    if not intervals:
        return None

    return round(sum(intervals) / len(intervals))


def _resolve_frequency(existing_frequency: Any, new_frequency: str) -> str:
    normalized_existing = str(existing_frequency or "").strip().lower()
    normalized_new = str(new_frequency or "").strip().lower()

    if normalized_new == "monthly":
        return "monthly"
    if normalized_existing == "monthly":
        return "monthly"
    if normalized_new == "marked":
        return "Marked"
    if normalized_existing == "marked":
        return "Marked"
    if normalized_new == "unknown":
        return "Unknown"
    if existing_frequency:
        return str(existing_frequency)
    return new_frequency


def _serialize_subscription(
    subscription: Subscription,
    transactions: list[Transaction],
) -> dict[str, Any]:
    average_interval_days = _average_interval_days(transactions)
    transaction_ids = _sorted_transaction_ids(transactions)

    return {
        "id": subscription.id,
        "merchant": subscription.merchant,
        "amount": _normalize_amount(subscription.amount),
        "frequency": subscription.frequency,
        "is_duplicate": bool(subscription.is_duplicate),
        "charge_count": len(transaction_ids),
        "first_charge_date": transactions[0].date if transactions else None,
        "last_charge_date": transactions[-1].date if transactions else None,
        "average_interval_days": average_interval_days,
        "transaction_ids": transaction_ids,
    }


def sync_user_subscriptions(
    db: Session,
    user_id: int,
    *,
    transactions: Optional[list[Transaction]] = None,
) -> list[dict[str, Any]]:
    if transactions is None:
        transactions = (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id)
            .order_by(asc(Transaction.date), asc(Transaction.id))
            .all()
        )
    else:
        transactions = sorted(transactions, key=lambda item: (item.date, item.id))

    existing_subscriptions = db.query(Subscription).filter(
        Subscription.user_id == user_id,
    ).all()

    subscriptions_by_key = {
        _subscription_lookup_key(subscription.merchant, subscription.amount): subscription
        for subscription in existing_subscriptions
    }

    grouped_expenses: dict[tuple[str, float], list[Transaction]] = defaultdict(list)
    grouped_marked: dict[tuple[str, float], list[Transaction]] = defaultdict(list)

    for transaction in transactions:
        normalized_cost = expense_amount(transaction.cost, transaction.category)
        merchant_key = _normalize_merchant(transaction.store_name)

        if normalized_cost <= 0 or not merchant_key:
            continue

        lookup_key = _subscription_lookup_key(merchant_key, normalized_cost)
        grouped_expenses[lookup_key].append(transaction)

        if is_subscription_category(transaction.category):
            grouped_marked[lookup_key].append(transaction)

    dirty = False
    seen_keys: set[tuple[str, float]] = set()
    active_subscriptions: list[dict[str, Any]] = []

    def upsert_subscription(
        *,
        lookup_key: tuple[str, float],
        grouped_transactions: list[Transaction],
        frequency: str,
        is_duplicate: bool,
    ) -> None:
        nonlocal dirty

        merchant_display = _display_merchant(grouped_transactions[-1].store_name)
        transaction_ids = _sorted_transaction_ids(grouped_transactions)
        subscription = subscriptions_by_key.get(lookup_key)
        resolved_frequency = _resolve_frequency(
            subscription.frequency if subscription is not None else None,
            frequency,
        )

        if subscription is None:
            subscription = Subscription(
                user_id=user_id,
                merchant=merchant_display,
                amount=lookup_key[1],
                frequency=resolved_frequency,
                is_duplicate=is_duplicate,
                is_active=True,
                transaction_id=transaction_ids,
            )
            db.add(subscription)
            db.flush()
            subscriptions_by_key[lookup_key] = subscription
            dirty = True
        else:
            if subscription.merchant != merchant_display:
                subscription.merchant = merchant_display
                dirty = True
            if _normalize_amount(subscription.amount) != lookup_key[1]:
                subscription.amount = lookup_key[1]
                dirty = True
            if subscription.frequency != resolved_frequency:
                subscription.frequency = resolved_frequency
                dirty = True
            if bool(subscription.is_duplicate) != is_duplicate:
                subscription.is_duplicate = is_duplicate
                dirty = True
            if list(subscription.transaction_id or []) != transaction_ids:
                subscription.transaction_id = transaction_ids
                dirty = True
            if not subscription.is_active:
                subscription.is_active = True
                dirty = True

        seen_keys.add(lookup_key)
        active_subscriptions.append(_serialize_subscription(subscription, grouped_transactions))

    for lookup_key, tx_list in grouped_expenses.items():
        if len(tx_list) < 2:
            continue

        is_monthly = True
        is_duplicate = False

        for index in range(1, len(tx_list)):
            days_diff = (tx_list[index].date - tx_list[index - 1].date).days

            if days_diff <= 3:
                is_duplicate = True
            elif not (25 <= days_diff <= 35):
                is_monthly = False

        if not is_monthly and not is_duplicate:
            continue

        upsert_subscription(
            lookup_key=lookup_key,
            grouped_transactions=tx_list,
            frequency="monthly" if is_monthly else "Unknown",
            is_duplicate=is_duplicate,
        )

    for lookup_key, tx_list in grouped_marked.items():
        if lookup_key in seen_keys:
            continue

        upsert_subscription(
            lookup_key=lookup_key,
            grouped_transactions=tx_list,
            frequency="Marked",
            is_duplicate=False,
        )

    for subscription in existing_subscriptions:
        lookup_key = _subscription_lookup_key(subscription.merchant, subscription.amount)

        if lookup_key in seen_keys:
            continue

        if subscription.is_active:
            subscription.is_active = False
            dirty = True
        if list(subscription.transaction_id or []):
            subscription.transaction_id = []
            dirty = True

    if dirty:
        db.commit()

    active_subscriptions.sort(
        key=lambda item: (
            -int(bool(item["is_duplicate"])),
            str(item["merchant"]).lower(),
            item["amount"],
        ),
    )
    return active_subscriptions
