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


def is_transfer_category(category: Any) -> bool:
    return normalize_category(category).startswith("transfer")


def is_investment_category(category: Any) -> bool:
    return normalize_category(category).startswith("investment")


def is_system_category(category: Any) -> bool:
    return normalize_category(category).startswith("system")


def is_budget_excluded_category(category: Any) -> bool:
    return (
        is_transfer_category(category)
        or is_investment_category(category)
        or is_system_category(category)
    )


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

    if is_transfer_category(category) or is_investment_category(category):
        return numeric_amount

    return -abs(numeric_amount)


def expense_amount(amount: Any, category: Any = None) -> float:
    normalized_amount = normalize_transaction_amount(amount, category)
    return abs(normalized_amount) if normalized_amount < 0 else 0.0


def income_amount(amount: Any, category: Any = None) -> float:
    normalized_amount = normalize_transaction_amount(amount, category)
    return normalized_amount if normalized_amount > 0 else 0.0


def budget_pressure_amount(amount: Any, category: Any = None) -> float:
    if is_budget_excluded_category(category):
        return 0.0

    return expense_amount(amount, category)


def calculate_budget_usage_percentage(total_spent: Any, budget_limit: Any) -> float:
    try:
        normalized_spent = max(float(total_spent or 0.0), 0.0)
    except (TypeError, ValueError):
        normalized_spent = 0.0

    try:
        normalized_budget = float(budget_limit or 0.0)
    except (TypeError, ValueError):
        normalized_budget = 0.0

    if normalized_budget > 0:
        return (normalized_spent / normalized_budget) * 100

    return 100.0 if normalized_spent > 0 else 0.0
