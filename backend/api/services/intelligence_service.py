from __future__ import annotations

import math
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import HTTPException
from sqlalchemy import extract
from sqlalchemy.orm import Session

from backend.api.models.budget import Budget
from backend.api.models.insight import AnomalyResult
from backend.api.models.intelligence import IntelligenceHistory
from backend.api.models.prediction import PredictionResult
from backend.api.models.transaction import Transaction
from backend.api.schemas.intelligence import (
    IntelligenceAnalysisDetails,
    IntelligenceAnalyzeRequest,
    IntelligenceHistoryResponse,
    IntelligenceProjectedImpact,
    IntelligenceResponse,
    IntelligenceScenario,
)
from pydantic import ValidationError
from backend.api.schemas.summary import ForecastDetail, HealthScoreDetail
from backend.api.services.cloudwatch_service import safe_put_metric
from backend.api.services.finance_logic import (
    budget_pressure_amount,
    calculate_budget_usage_percentage,
    expense_amount,
    is_subscription_category,
)
import time
import logging

logger = logging.getLogger(__name__)

LIKELY_RECURRING_CATEGORY_KEYWORDS = {
    "billing",
    "entertainment",
    "insurance",
    "internet",
    "phone",
    "rent",
    "streaming",
    "subscription",
    "utilities",
    "utility",
}

LIKELY_RECURRING_MERCHANT_KEYWORDS = {
    "apple",
    "at&t",
    "comcast",
    "duke energy",
    "gas",
    "gym",
    "hulu",
    "internet",
    "netflix",
    "rent",
    "spotify",
    "utility",
    "verizon",
    "water",
}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _round_money(value: Any) -> float:
    return round(float(value or 0.0), 2)


def _round_score(value: Any) -> float:
    return round(float(value or 0.0), 4)


def _normalize_timestamp_value(value: Any) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    return datetime.min.replace(tzinfo=timezone.utc)


def _coerce_date_like(value: Any) -> Optional[date]:
    if value is None:
        return None

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value).date()
        except ValueError:
            return None

    return None


def _period_key(target_date: date) -> str:
    return target_date.strftime("%Y-%m")


def _parse_period(period: str) -> tuple[int, int]:
    try:
        year, month = map(int, period.split("-"))
        return year, month
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Period must be in the format YYYY-MM") from exc


def _resolve_risk_level(percentage_used: float) -> str:
    if percentage_used >= 90:
        return "Risk"
    if percentage_used >= 70:
        return "Moderate"
    return "Good"


def _resolve_frequency_multipliers(frequency: str) -> tuple[float, float]:
    normalized = StringNormalizer.normalize(frequency)

    if normalized == "one_time":
        return 1.0, 1.0
    if normalized == "monthly":
        return 1.0, 12.0
    if normalized == "weekly":
        return 4.33, 52.0
    if normalized == "yearly":
        return 1.0 / 12.0, 1.0

    raise HTTPException(
        status_code=400,
        detail="Invalid frequency. Use 'one_time', 'monthly', 'weekly', or 'yearly'",
    )


def _validate_transaction_type(transaction_type: str) -> str:
    normalized = StringNormalizer.normalize(transaction_type or "spend")

    if normalized == "spend":
        return normalized
    if normalized == "deposit":
        return normalized

    raise HTTPException(
        status_code=400,
        detail="Invalid transaction_type. Use 'spend' or 'deposit'.",
    )


class StringNormalizer:
    @staticmethod
    def normalize(value: Any) -> str:
        return str(value or "").strip().lower()


def _resolve_budget_for_date(db: Session, user_id: int, action_date: date) -> Budget:
    current_period = _period_key(action_date)

    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.period == current_period,
    ).first()

    if budget:
        return budget

    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
    ).order_by(Budget.period.desc()).first()

    if budget:
        return budget

    raise HTTPException(
        status_code=404,
        detail="No budget found. Create a budget to simulate impact accurately.",
    )


def _get_period_transactions(db: Session, user_id: int, period: str) -> list[Transaction]:
    target_year, target_month = _parse_period(period)

    return db.query(Transaction).filter(
        Transaction.user_id == user_id,
        extract("year", Transaction.date) == target_year,
        extract("month", Transaction.date) == target_month,
    ).all()


def _sum_period_transactions(
    db: Session,
    user_id: int,
    period: str,
    *,
    transactions: Optional[list[Transaction]] = None,
) -> float:
    if transactions is None:
        transactions = _get_period_transactions(db, user_id, period)
    return float(sum(
        budget_pressure_amount(transaction.cost, transaction.category)
        for transaction in transactions
    ))


def _sum_subscription_transactions(
    db: Session,
    user_id: int,
    period: str,
    *,
    transactions: Optional[list[Transaction]] = None,
) -> float:
    if transactions is None:
        transactions = _get_period_transactions(db, user_id, period)

    return float(sum(
        expense_amount(transaction.cost, transaction.category)
        for transaction in transactions
        if is_subscription_category(transaction.category)
    ))


def _build_category_effect(
    merchant: Optional[str],
    category: Optional[str],
    transaction_type: str,
) -> str:
    merchant_label = str(merchant or "").strip()
    category_label = str(category or "").strip()

    if merchant_label:
        return merchant_label
    if category_label:
        return category_label
    if StringNormalizer.normalize(transaction_type) == "deposit":
        return "Income"
    return "General spend"


def _is_likely_recurring_transaction(transaction: Transaction) -> bool:
    merchant = StringNormalizer.normalize(transaction.store_name)
    category = StringNormalizer.normalize(transaction.category)

    if is_subscription_category(category):
        return True

    if any(keyword in category for keyword in LIKELY_RECURRING_CATEGORY_KEYWORDS):
        return True

    return any(keyword in merchant for keyword in LIKELY_RECURRING_MERCHANT_KEYWORDS)


def _next_predicted_charge_date(last_charge_date: date, interval_days: Optional[int]) -> date:
    estimated_interval = max(7, int(interval_days or 30))
    next_charge_date = last_charge_date + timedelta(days=estimated_interval)
    today = _utc_now().date()

    while next_charge_date < today:
        next_charge_date += timedelta(days=estimated_interval)

    return next_charge_date


def _build_derived_prediction_record(
    *,
    prediction_id: int,
    merchant: str,
    amount: float,
    confidence: float,
    explanation: str,
    next_charge_date: date,
) -> IntelligenceHistoryResponse:
    timestamp = datetime.combine(next_charge_date, datetime.min.time(), tzinfo=timezone.utc)

    return IntelligenceHistoryResponse(
        id=prediction_id,
        source="prediction.derived",
        risk_score=_round_score(_clamp(amount / 250.0, 0.18, 0.82)),
        recommendation="Likely upcoming charge",
        explanation=explanation,
        projected_impact=IntelligenceProjectedImpact(
            balance_change=_round_money(-amount),
            budget_impact=_round_money(amount),
            category_effect=merchant,
        ),
        confidence=_round_score(confidence),
        timestamp=timestamp,
        details=None,
    )


def _generate_derived_prediction_records(
    db: Session,
    user_id: int,
    *,
    limit: int,
) -> list[IntelligenceHistoryResponse]:
    if limit <= 0:
        return []

    cutoff_date = (_utc_now() - timedelta(days=365)).date()

    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id, Transaction.date >= cutoff_date)
        .order_by(Transaction.date.asc(), Transaction.id.asc())
        .all()
    )

    if not transactions:
        return []

    grouped_transactions: dict[tuple[str, float], list[Transaction]] = defaultdict(list)
    candidate_predictions: list[IntelligenceHistoryResponse] = []
    seen_prediction_keys: set[tuple[str, float]] = set()
    next_prediction_id = -1

    for transaction in transactions:
        normalized_amount = expense_amount(transaction.cost, transaction.category)
        merchant_key = StringNormalizer.normalize(transaction.store_name)

        if normalized_amount <= 0 or not merchant_key:
            continue

        grouped_transactions[(merchant_key, _round_money(normalized_amount))].append(transaction)

    for (merchant_key, normalized_amount), entries in grouped_transactions.items():
        if len(candidate_predictions) >= limit:
            break

        if len(entries) < 2:
            continue

        intervals = [
            (entries[index].date - entries[index - 1].date).days
            for index in range(1, len(entries))
        ]

        if not intervals:
            continue

        average_interval_days = max(7, round(sum(intervals) / len(intervals)))
        monthly_like = all(21 <= interval <= 40 for interval in intervals)
        duplicate_like = any(interval <= 3 for interval in intervals)
        subscription_like = any(is_subscription_category(entry.category) for entry in entries)

        if not monthly_like and not duplicate_like and not subscription_like:
            continue

        last_transaction = entries[-1]
        merchant_label = last_transaction.store_name.strip() or "Recurring charge"
        next_charge_date = _next_predicted_charge_date(last_transaction.date, average_interval_days)
        confidence = 0.93 if monthly_like else 0.82 if subscription_like else 0.74
        explanation = (
            f"{merchant_label} appeared {len(entries)} times in your transaction history and "
            f"is likely to recur around {next_charge_date.isoformat()}."
        )

        candidate_predictions.append(
            _build_derived_prediction_record(
                prediction_id=next_prediction_id,
                merchant=merchant_label,
                amount=normalized_amount,
                confidence=confidence,
                explanation=explanation,
                next_charge_date=next_charge_date,
            )
        )
        seen_prediction_keys.add((merchant_key, normalized_amount))
        next_prediction_id -= 1

    if len(candidate_predictions) >= limit:
        return candidate_predictions[:limit]

    recent_likely_recurring = [
        transaction
        for transaction in sorted(transactions, key=lambda item: item.date, reverse=True)
        if expense_amount(transaction.cost, transaction.category) > 0
        and _is_likely_recurring_transaction(transaction)
    ]

    for transaction in recent_likely_recurring:
        if len(candidate_predictions) >= limit:
            break

        merchant_key = StringNormalizer.normalize(transaction.store_name)
        normalized_amount = _round_money(expense_amount(transaction.cost, transaction.category))
        prediction_key = (merchant_key, normalized_amount)

        if not merchant_key or prediction_key in seen_prediction_keys:
            continue

        merchant_label = transaction.store_name.strip() or (transaction.category or "Expected charge")
        next_charge_date = _next_predicted_charge_date(transaction.date, 30)
        explanation = (
            f"{merchant_label} looks like a recurring expense based on its merchant/category pattern. "
            f"Trace is modeling another charge around {next_charge_date.isoformat()}."
        )

        candidate_predictions.append(
            _build_derived_prediction_record(
                prediction_id=next_prediction_id,
                merchant=merchant_label,
                amount=normalized_amount,
                confidence=0.58,
                explanation=explanation,
                next_charge_date=next_charge_date,
            )
        )
        seen_prediction_keys.add(prediction_key)
        next_prediction_id -= 1

    candidate_predictions.sort(key=lambda item: item.timestamp, reverse=True)
    return candidate_predictions[:limit]


def _build_transaction_recommendation(
    *,
    transaction_type: str,
    projected_percentage_used: float,
    remaining_budget: float,
    worst_percentage: float,
    budget_limit: float,
    balance_change: float,
) -> tuple[str, str, float]:
    normalized_type = StringNormalizer.normalize(transaction_type)

    if normalized_type == "deposit":
        recommendation = "Improves cash position"
        explanation = (
            f"This deposit improves projected cash by ${_round_money(balance_change):.2f}, "
            f"keeps current-period budget use at {_round_money(projected_percentage_used)}%, "
            f"and leaves ${_round_money(remaining_budget):.2f} remaining in the current period."
        )
        return recommendation, explanation, 0.9

    if projected_percentage_used > 100 or remaining_budget < 0:
        recommendation = "Delay this decision"
        explanation = (
            f"This action would push projected budget use to {_round_money(projected_percentage_used)}% "
            f"and overshoot the current budget by ${_round_money(abs(remaining_budget)):.2f}."
        )
        return recommendation, explanation, 0.95

    if projected_percentage_used >= 90:
        recommendation = "High budget risk"
        explanation = (
            f"This action would leave only ${_round_money(remaining_budget):.2f} "
            f"against a ${_round_money(budget_limit):.2f} budget."
        )
        return recommendation, explanation, 0.9

    if worst_percentage >= 90:
        recommendation = "Proceed with caution"
        explanation = (
            f"The base scenario stays within budget, but a worse-case swing could raise use "
            f"to {_round_money(worst_percentage)}%."
        )
        return recommendation, explanation, 0.82

    if projected_percentage_used >= 70:
        recommendation = "Monitor closely"
        explanation = (
            f"This keeps projected budget use at {_round_money(projected_percentage_used)}% "
            f"with ${_round_money(remaining_budget):.2f} remaining."
        )
        return recommendation, explanation, 0.88

    recommendation = "Within budget"
    explanation = (
        f"This action keeps projected budget use at {_round_money(projected_percentage_used)}% "
        f"and leaves ${_round_money(remaining_budget):.2f} available for the rest of the period."
    )
    return recommendation, explanation, 0.88


def _build_risk_score(
    *,
    transaction_type: str,
    projected_percentage_used: float,
    remaining_budget: float,
    worst_percentage: float,
) -> float:
    usage_ratio = _clamp(projected_percentage_used / 100.0, 0.0, 1.0)

    if StringNormalizer.normalize(transaction_type) == "deposit":
        return _round_score(_clamp(usage_ratio * 0.35, 0.0, 1.0))

    if projected_percentage_used > 100 or remaining_budget < 0:
        return _round_score(_clamp(max(0.88, usage_ratio), 0.0, 1.0))

    if worst_percentage >= 90:
        return _round_score(_clamp(max(0.72, usage_ratio * 0.9), 0.0, 1.0))

    if projected_percentage_used >= 70:
        return _round_score(_clamp(max(0.45, usage_ratio * 0.8), 0.0, 1.0))

    return _round_score(_clamp(max(0.12, usage_ratio * 0.45), 0.0, 1.0))


def analyze_transaction_decision(
    db: Session,
    user_id: int,
    request: IntelligenceAnalyzeRequest,
    *,
    emit_prediction_metrics: bool = True,
) -> IntelligenceResponse:

    if emit_prediction_metrics:
        safe_put_metric("Trace/Prediction", "PredictionRequests", 1)
    start_time = time.time()

    action_date = request.action_date or _utc_now().date()
    budget = _resolve_budget_for_date(db, user_id, action_date)

    current_spent = _sum_period_transactions(db, user_id, budget.period)
    current_budget_limit = float(budget.amount)

    transaction_type = _validate_transaction_type(request.transaction_type)
    monthly_multiplier, yearly_multiplier = _resolve_frequency_multipliers(request.frequency)
    transaction_amount = float(request.amount)
    is_deposit = transaction_type == "deposit"
    budget_spend_amount = budget_pressure_amount(transaction_amount, request.category)

    projected_monthly_spend_delta = (
        0.0
        if is_deposit
        else budget_spend_amount * monthly_multiplier
    )
    projected_yearly_spend_delta = (
        0.0
        if is_deposit
        else budget_spend_amount * yearly_multiplier
    )
    balance_change = (
        transaction_amount * monthly_multiplier
        if is_deposit
        else -(transaction_amount * monthly_multiplier)
    )

    projected_spent = current_spent + projected_monthly_spend_delta
    remaining_budget = current_budget_limit - projected_spent

    current_percentage_used = calculate_budget_usage_percentage(current_spent, current_budget_limit)
    projected_percentage_used = calculate_budget_usage_percentage(projected_spent, current_budget_limit)

    risk_level = _resolve_risk_level(projected_percentage_used)

    scenario_inputs = [
        ("Base Case", 1.0),
        ("Best Case", 0.85),
        ("Worst Case", 1.20),
    ]
    scenarios: list[IntelligenceScenario] = []
    worst_percentage = projected_percentage_used

    for scenario_type, multiplier in scenario_inputs:
        scenario_spend_delta = projected_monthly_spend_delta * multiplier
        scenario_balance_change = balance_change * multiplier
        scenario_projected_spent = current_spent + scenario_spend_delta
        scenario_remaining_budget = current_budget_limit - scenario_projected_spent
        scenario_percentage = calculate_budget_usage_percentage(
            scenario_projected_spent,
            current_budget_limit,
        )
        worst_percentage = max(worst_percentage, scenario_percentage)

        scenarios.append(
            IntelligenceScenario(
                scenario_type=scenario_type,
                projected_spent_this_period=_round_money(scenario_projected_spent),
                remaining_budget_after_purchase=_round_money(scenario_remaining_budget),
                projected_percentage_used=_round_money(scenario_percentage),
                risk_level=_resolve_risk_level(scenario_percentage),
                balance_change=_round_money(scenario_balance_change),
            )
        )

    balance_change = _round_money(balance_change)
    budget_impact = _round_money(projected_percentage_used - current_percentage_used)
    recommendation, explanation, confidence = _build_transaction_recommendation(
        transaction_type=request.transaction_type,
        projected_percentage_used=projected_percentage_used,
        remaining_budget=remaining_budget,
        worst_percentage=worst_percentage,
        budget_limit=current_budget_limit,
        balance_change=balance_change,
    )

    response = IntelligenceResponse(
        risk_score=_build_risk_score(
            transaction_type=request.transaction_type,
            projected_percentage_used=projected_percentage_used,
            remaining_budget=remaining_budget,
            worst_percentage=worst_percentage,
        ),
        recommendation=recommendation,
        explanation=explanation,
        projected_impact=IntelligenceProjectedImpact(
            balance_change=balance_change,
            budget_impact=budget_impact,
            category_effect=_build_category_effect(
                request.merchant,
                request.category,
                request.transaction_type,
            ),
        ),
        confidence=_round_score(confidence),
        timestamp=_utc_now(),
        details=IntelligenceAnalysisDetails(
            analysis_type="transaction_decision",
            current_period=budget.period,
            action_date=action_date,
            merchant=request.merchant,
            category=request.category,
            budget_limit=_round_money(current_budget_limit),
            current_spent_this_period=_round_money(current_spent),
            projected_spent_this_period=_round_money(projected_spent),
            current_percentage_used=_round_money(current_percentage_used),
            projected_percentage_used=_round_money(projected_percentage_used),
            remaining_budget_after_purchase=_round_money(remaining_budget),
            risk_level=risk_level,
            projected_monthly_spend_delta=_round_money(projected_monthly_spend_delta),
            projected_yearly_spend_delta=_round_money(projected_yearly_spend_delta),
            scenarios=scenarios,
        ),
    )

    if request.save_to_history:
        save_history_record(
            db=db,
            user_id=user_id,
            analysis=response,
            source=request.source,
        )

    # Calculate and emit latency metrics (non-blocking, only when requested)
    if emit_prediction_metrics:
        latency = time.time() - start_time
        safe_put_metric("Trace/Prediction", "PredictionLatency", latency, unit="Seconds")
        logger.info(f"Intelligence analysis completed in {latency:.4f}s")
 
    return response


def build_legacy_simulation_response(analysis: IntelligenceResponse) -> dict[str, Any]:
    if analysis.details is None:
        raise HTTPException(status_code=500, detail="Intelligence analysis details are unavailable.")

    details = analysis.details

    return {
        "projected_monthly_cost": _round_money(details.projected_monthly_spend_delta),
        "projected_yearly_cost": _round_money(details.projected_yearly_spend_delta),
        "current_monthly_budget": _round_money(details.budget_limit),
        "current_spent_this_period": _round_money(details.current_spent_this_period),
        "projected_spent_this_period": _round_money(details.projected_spent_this_period),
        "current_percentage_used": _round_money(details.current_percentage_used),
        "projected_percentage_used": _round_money(details.projected_percentage_used),
        "remaining_budget_after_purchase": _round_money(details.remaining_budget_after_purchase),
        "risk_level": details.risk_level,
        "confidence_level": _round_score(analysis.confidence),
        "recommendation": f"{analysis.recommendation}. {analysis.explanation}",
        "scenarios": [scenario.model_dump() for scenario in details.scenarios],
    }


def build_legacy_predict_response(
    analysis: IntelligenceResponse,
    *,
    latency: float,
    cached: bool,
) -> dict[str, Any]:
    response = analysis.model_dump(mode="json")
    response["cached"] = cached
    response["latency"] = round(float(latency or 0.0), 6)
    response["message"] = "Prediction executed successfully"
    return response


def save_history_record(
    *,
    db: Session,
    user_id: int,
    analysis: IntelligenceResponse,
    source: str,
) -> IntelligenceHistoryResponse:
    record = IntelligenceHistory(
        user_id=user_id,
        source=source,
        risk_score=float(analysis.risk_score),
        recommendation=analysis.recommendation,
        explanation=analysis.explanation,
        balance_change=float(analysis.projected_impact.balance_change),
        budget_impact=float(analysis.projected_impact.budget_impact),
        category_effect=analysis.projected_impact.category_effect,
        confidence=float(analysis.confidence),
        details=analysis.details.model_dump(mode="json") if analysis.details is not None else None,
        created_at=analysis.timestamp,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return serialize_history_record(record)


def build_legacy_history_analysis(
    *,
    target_date: Optional[date],
    predicted_spending: float,
    expected_savings: float,
    confidence_level: float,
) -> IntelligenceResponse:
    timestamp = _utc_now()
    predicted_spending = _round_money(predicted_spending)
    expected_savings = _round_money(expected_savings)
    confidence_level = _round_score(confidence_level)

    return IntelligenceResponse(
        risk_score=_round_score(_clamp(1.0 - confidence_level, 0.0, 1.0)),
        recommendation="Legacy prediction saved",
        explanation=(
            f"Imported legacy prediction for {target_date.isoformat() if target_date else 'an unspecified date'}."
        ),
        projected_impact=IntelligenceProjectedImpact(
            balance_change=_round_money(-predicted_spending),
            budget_impact=expected_savings,
            category_effect="Legacy prediction",
        ),
        confidence=confidence_level,
        timestamp=timestamp,
        details=None,
    )


def serialize_history_record(record: IntelligenceHistory) -> IntelligenceHistoryResponse:
    details = None
    if record.details:
        try:
            details = IntelligenceAnalysisDetails.model_validate(record.details)
        except (ValidationError, TypeError, ValueError) as exc:
            logger.warning(
                "Skipping invalid intelligence history details for record %s: %s",
                record.id,
                exc,
                exc_info=True,
            )

    return IntelligenceHistoryResponse(
        id=record.id,
        source=record.source,
        risk_score=_round_score(record.risk_score),
        recommendation=record.recommendation,
        explanation=record.explanation,
        projected_impact=IntelligenceProjectedImpact(
            balance_change=_round_money(record.balance_change),
            budget_impact=_round_money(record.budget_impact),
            category_effect=record.category_effect,
        ),
        confidence=_round_score(record.confidence),
        timestamp=record.created_at,
        details=details,
    )


def map_legacy_prediction_record(record: PredictionResult) -> IntelligenceHistoryResponse:
    confidence = _round_score(record.confidence_level)

    target_date = _coerce_date_like(record.target_data)

    return IntelligenceHistoryResponse(
        id=record.id,
        source="prediction.history.legacy",
        risk_score=_round_score(_clamp(1.0 - confidence, 0.0, 1.0)),
        recommendation="Legacy prediction history",
        explanation=(
            f"Imported legacy prediction for {target_date.isoformat() if target_date else 'an unspecified date'}."
        ),
        projected_impact=IntelligenceProjectedImpact(
            balance_change=_round_money(-(record.predicted_spending or 0.0)),
            budget_impact=_round_money(record.expected_savings or 0.0),
            category_effect="Legacy prediction",
        ),
        confidence=confidence,
        timestamp=record.created_at,
        details=None,
    )


def list_history_records(db: Session, user_id: int, limit: int = 12) -> list[IntelligenceHistoryResponse]:
    new_records = db.query(IntelligenceHistory).filter(
        IntelligenceHistory.user_id == user_id,
    ).order_by(IntelligenceHistory.created_at.desc()).limit(limit).all()

    legacy_records = db.query(PredictionResult).filter(
        PredictionResult.user_id == user_id,
    ).order_by(PredictionResult.created_at.desc()).limit(limit).all()

    combined: list[IntelligenceHistoryResponse] = []

    for record in new_records:
        try:
            combined.append(serialize_history_record(record))
        except Exception as exc:
            logger.warning(
                "Skipping malformed intelligence history record %s: %s",
                getattr(record, "id", "unknown"),
                exc,
                exc_info=True,
            )

    for record in legacy_records:
        try:
            combined.append(map_legacy_prediction_record(record))
        except Exception as exc:
            logger.warning(
                "Skipping malformed legacy prediction record %s: %s",
                getattr(record, "id", "unknown"),
                exc,
                exc_info=True,
            )

    remaining_slots = max(0, limit - len(combined))

    if remaining_slots > 0:
        combined.extend(
            _generate_derived_prediction_records(
                db=db,
                user_id=user_id,
                limit=remaining_slots,
            )
        )

    combined.sort(
        key=lambda item: _normalize_timestamp_value(item.timestamp),
        reverse=True,
    )
    return combined[:limit]


def delete_history_records(
    db: Session,
    user_id: int,
    *,
    days_to_keep: int,
) -> int:
    cutoff_date = _utc_now() - timedelta(days=days_to_keep)

    deleted_new = db.query(IntelligenceHistory).filter(
        IntelligenceHistory.user_id == user_id,
        IntelligenceHistory.created_at < cutoff_date,
    ).delete(synchronize_session=False)

    deleted_legacy = db.query(PredictionResult).filter(
        PredictionResult.user_id == user_id,
        PredictionResult.created_at < cutoff_date,
    ).delete(synchronize_session=False)

    db.commit()
    return int(deleted_new or 0) + int(deleted_legacy or 0)


def calculate_financial_health(db: Session, user_id: int, period: str) -> dict[str, Any]:
    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.period == period,
    ).first()

    if not budget:
        raise HTTPException(status_code=404, detail=f"No budget found for period {period}")

    period_transactions = _get_period_transactions(db, user_id, period)
    total_spent = _sum_period_transactions(db, user_id, period, transactions=period_transactions)
    subscription_total = _sum_subscription_transactions(db, user_id, period, transactions=period_transactions)
    effective_spend = max(total_spent, 0.0)

    remaining_balance = float(budget.amount) - total_spent
    percentage_used = calculate_budget_usage_percentage(effective_spend, budget.amount)

    raw_score = 100 - percentage_used
    if float(budget.amount) > 0:
        subscription_ratio = (subscription_total / float(budget.amount)) * 100
        raw_score -= subscription_ratio * 0.15

    score = max(0, min(100, int(round(raw_score))))

    return {
        "period": period,
        "score": score,
        "budget_limit": _round_money(budget.amount),
        "total_spent": _round_money(total_spent),
        "remaining_balance": _round_money(remaining_balance),
        "percentage_used": _round_money(percentage_used),
        "status": _resolve_risk_level(percentage_used),
    }


def build_health_score_detail(db: Session, user_id: int) -> HealthScoreDetail:
    now = _utc_now()
    current_period = f"{now.year}-{now.month:02d}"

    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.period == current_period,
    ).first()

    if not budget:
        return HealthScoreDetail(
            score=0,
            status="Unknown",
            recommendation="No budget set for current month. Set up a budget to unlock your health score.",
        )

    health = calculate_financial_health(db, user_id, current_period)
    percentage_used = float(health["percentage_used"])

    if percentage_used >= 90:
        recommendation = f"Warning: You have used {_round_money(percentage_used)}% of the budget."
    elif percentage_used >= 70:
        recommendation = "You are pacing normally, but watch your spending."
    else:
        recommendation = "Great job. You are well under your budget limit."

    return HealthScoreDetail(
        score=health["score"],
        status=health["status"],
        recommendation=recommendation,
    )


def build_forecast_detail(db: Session, user_id: int) -> ForecastDetail:
    now = _utc_now()
    current_period = f"{now.year}-{now.month:02d}"

    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.period == current_period,
    ).first()

    total_spent = _sum_period_transactions(db, user_id, current_period)
    budget_amount = float(budget.amount) if budget else 0.0
    expected_savings = budget_amount - total_spent

    return ForecastDetail(
        predicted_spend=_round_money(total_spent),
        expected_savings=_round_money(expected_savings),
        target_date=now.date(),
    )


def calculate_category_trends(db: Session, user_id: int) -> dict[str, list[dict[str, Any]]]:
    now = _utc_now()
    current_month = now.month
    current_year = now.year

    if current_month == 1:
        previous_month = 12
        previous_year = current_year - 1
    else:
        previous_month = current_month - 1
        previous_year = current_year

    current_transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        extract("month", Transaction.date) == current_month,
        extract("year", Transaction.date) == current_year,
    ).all()

    previous_transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        extract("month", Transaction.date) == previous_month,
        extract("year", Transaction.date) == previous_year,
    ).all()

    current_dict: dict[str, float] = defaultdict(float)
    for transaction in current_transactions:
        category = transaction.category or "Other"
        current_dict[category] += expense_amount(transaction.cost, transaction.category)

    previous_dict: dict[str, float] = defaultdict(float)
    for transaction in previous_transactions:
        category = transaction.category or "Other"
        previous_dict[category] += expense_amount(transaction.cost, transaction.category)

    trends = []
    all_categories = set(current_dict.keys()).union(set(previous_dict.keys()))

    for category in all_categories:
        current_amount = current_dict.get(category, 0.0)
        previous_amount = previous_dict.get(category, 0.0)

        if previous_amount == 0:
            percentage_change = 100.0 if current_amount > 0 else 0.0
        else:
            percentage_change = ((current_amount - previous_amount) / previous_amount) * 100.0

        if current_amount > previous_amount:
            trend_direction = "Spending more"
        elif current_amount < previous_amount:
            trend_direction = "Spending less"
        else:
            trend_direction = "FLAT"

        trends.append({
            "category": category,
            "current_month_spent": _round_money(current_amount),
            "previous_month_spent": _round_money(previous_amount),
            "percentage_change": round(percentage_change, 1),
            "trend_direction": trend_direction,
        })

    return {"trends": trends}


def detect_spending_anomalies(db: Session, user_id: int) -> list[dict[str, Any]]:
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
    ).all()

    merchant_costs: dict[str, list[float]] = defaultdict(list)
    for transaction in transactions:
        normalized_amount = expense_amount(transaction.cost, transaction.category)
        if normalized_amount <= 0:
            continue
        normalized_store = transaction.store_name.strip().lower()
        merchant_costs[normalized_store].append(normalized_amount)

    existing_anomalies = db.query(AnomalyResult).filter(
        AnomalyResult.user_id == user_id,
    ).all()
    existing_anomaly_tx_ids = {item.transaction_id for item in existing_anomalies}

    anomalies = []
    new_anomalies = []

    for transaction in transactions:
        normalized_amount = expense_amount(transaction.cost, transaction.category)
        if normalized_amount <= 0:
            continue

        normalized_store = transaction.store_name.strip().lower()
        all_costs = merchant_costs[normalized_store]

        if len(all_costs) < 4:
            continue

        other_costs = all_costs.copy()
        other_costs.remove(normalized_amount)

        clean_mean = sum(other_costs) / len(other_costs)
        variance = sum(((value - clean_mean) ** 2) for value in other_costs) / len(other_costs)
        clean_std_dev = math.sqrt(variance)

        if clean_std_dev == 0:
            continue

        z_score = (normalized_amount - clean_mean) / clean_std_dev

        if z_score <= 2.5 or normalized_amount < 50 or normalized_amount <= clean_mean:
            continue

        if transaction.id not in existing_anomaly_tx_ids:
            new_anomalies.append(
                AnomalyResult(
                    user_id=user_id,
                    transaction_id=transaction.id,
                    category=transaction.category,
                    merchant=transaction.store_name,
                    actual_amount=_round_money(normalized_amount),
                    expected_amount=_round_money(clean_mean),
                    anomaly_type="Spike",
                    created_at=transaction.date,
                )
            )
            existing_anomaly_tx_ids.add(transaction.id)

        anomalies.append({
            "category": transaction.category,
            "merchant": transaction.store_name,
            "actual_amount": _round_money(normalized_amount),
            "expected_amount": _round_money(clean_mean),
            "anomaly_type": "Spike",
            "date": transaction.date,
        })

    if new_anomalies:
        db.add_all(new_anomalies)
        db.commit()

    return anomalies
