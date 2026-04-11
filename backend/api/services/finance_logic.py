from __future__ import annotations

import math
from typing import Any


INCOME_CATEGORY_KEYWORDS = {
    "bonus",
    "deposit",
    "income",
    "interest",
    "paycheck",
    "refund",
    "salary",
}


def normalize_category(category: Any) -> str:
    return str(category or "").strip().lower()


def is_income_category(category: Any) -> bool:
    normalized = normalize_category(category)

    if not normalized:
        return False

    if normalized.startswith("income"):
        return True

    return normalized in INCOME_CATEGORY_KEYWORDS


def is_subscription_category(category: Any) -> bool:
    return normalize_category(category).startswith("subscription")


def normalize_transaction_amount(amount: Any, category: Any = None) -> float:
    try:
        numeric_amount = float(amount or 0.0)
    except (TypeError, ValueError):
        return 0.0

    if not math.isfinite(numeric_amount) or numeric_amount == 0:
        return 0.0

    if is_income_category(category):
        return abs(numeric_amount)

    return -abs(numeric_amount)


def expense_amount(amount: Any, category: Any = None) -> float:
    normalized_amount = normalize_transaction_amount(amount, category)
    return abs(normalized_amount) if normalized_amount < 0 else 0.0


def income_amount(amount: Any, category: Any = None) -> float:
    normalized_amount = normalize_transaction_amount(amount, category)
    return normalized_amount if normalized_amount > 0 else 0.0


def budget_pressure_amount(amount: Any, category: Any = None) -> float:
    normalized_amount = normalize_transaction_amount(amount, category)

    if normalized_amount < 0:
        return abs(normalized_amount)

    if normalized_amount > 0:
        return -normalized_amount

    return 0.0
