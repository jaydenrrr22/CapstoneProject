from datetime import date, datetime, timezone
from unittest.mock import MagicMock

from backend.api.models.intelligence import IntelligenceHistory
from backend.api.models.budget import Budget
from backend.api.models.transaction import Transaction
from backend.api.schemas.intelligence import IntelligenceAnalyzeRequest
from backend.api.services.intelligence_service import (
    analyze_transaction_decision,
    calculate_financial_health,
    list_history_records,
    safe_parse_details,
    safe_parse_target,
    serialize_history_record,
)
from backend.api.models.prediction import PredictionResult
from backend.api.services.finance_logic import (
    budget_pressure_amount,
    normalize_transaction_amount,
)


def _build_query_side_effect(*, budget: Budget, transactions: list[Transaction]):
    def _query(model, *args, **kwargs):
        mock_query = MagicMock()

        if model is Budget:
            mock_query.filter.return_value.first.return_value = budget
            mock_query.filter.return_value.order_by.return_value.first.return_value = budget
        elif model is Transaction:
            mock_query.filter.return_value.all.return_value = transactions

        return mock_query

    return _query


def _sample_transactions(user_id: int) -> list[Transaction]:
    return [
        Transaction(
            id=1,
            cost=20.0,
            date=date(2026, 3, 2),
            store_name="Spotify",
            category="Subscription - Music",
            user_id=user_id,
        ),
        Transaction(
            id=2,
            cost=20.0,
            date=date(2026, 3, 8),
            store_name="Netflix",
            category="Subscription - Entertainment",
            user_id=user_id,
        ),
        Transaction(
            id=3,
            cost=8.99,
            date=date(2026, 3, 12),
            store_name="iCloud",
            category="Subscription - Storage",
            user_id=user_id,
        ),
        Transaction(
            id=4,
            cost=98.99,
            date=date(2026, 3, 13),
            store_name="Target",
            category="Groceries",
            user_id=user_id,
        ),
        Transaction(
            id=5,
            cost=199.99,
            date=date(2026, 3, 14),
            store_name="Payroll",
            category="Income",
            user_id=user_id,
        ),
    ]


def test_calculate_financial_health_ignores_income_transactions() -> None:
    user_id = 42
    budget = Budget(id=1, amount=2500.0, period="2026-03", user_id=user_id)
    transactions = _sample_transactions(user_id)
    mock_db = MagicMock()
    mock_db.query.side_effect = _build_query_side_effect(budget=budget, transactions=transactions)

    result = calculate_financial_health(mock_db, user_id, "2026-03")

    assert result["total_spent"] == 147.98
    assert result["remaining_balance"] == 2352.02
    assert result["percentage_used"] == 5.92


def test_calculate_financial_health_ignores_transfer_investment_and_system_budget_rows() -> None:
    user_id = 42
    budget = Budget(id=1, amount=2500.0, period="2026-03", user_id=user_id)
    transactions = [
        Transaction(
            id=1,
            cost=100.0,
            date=date(2026, 3, 2),
            store_name="Publix",
            category="Groceries",
            user_id=user_id,
        ),
        Transaction(
            id=2,
            cost=-200.0,
            date=date(2026, 3, 3),
            store_name="Transfer to Savings",
            category="Transfer",
            user_id=user_id,
        ),
        Transaction(
            id=3,
            cost=-300.0,
            date=date(2026, 3, 4),
            store_name="Vanguard",
            category="Investment",
            user_id=user_id,
        ),
        Transaction(
            id=4,
            cost=-0.01,
            date=date(2026, 3, 5),
            store_name="End of Dataset Marker",
            category="System",
            user_id=user_id,
        ),
    ]
    mock_db = MagicMock()
    mock_db.query.side_effect = _build_query_side_effect(budget=budget, transactions=transactions)

    result = calculate_financial_health(mock_db, user_id, "2026-03")

    assert result["total_spent"] == 100.0
    assert result["remaining_balance"] == 2400.0
    assert result["percentage_used"] == 4.0


def test_analyze_transaction_decision_deposit_does_not_reduce_budget_usage() -> None:
    user_id = 42
    budget = Budget(id=1, amount=2500.0, period="2026-03", user_id=user_id)
    transactions = _sample_transactions(user_id)
    mock_db = MagicMock()
    mock_db.query.side_effect = _build_query_side_effect(budget=budget, transactions=transactions)

    analysis = analyze_transaction_decision(
        db=mock_db,
        user_id=user_id,
        request=IntelligenceAnalyzeRequest(
            amount=199.99,
            action_date=date(2026, 3, 15),
            merchant="Payroll",
            category="Income",
            transaction_type="deposit",
            frequency="one_time",
        ),
        emit_prediction_metrics=False,
    )

    assert analysis.projected_impact.balance_change == 199.99
    assert analysis.projected_impact.budget_impact == 0.0
    assert analysis.details is not None
    assert analysis.details.current_spent_this_period == 147.98
    assert analysis.details.projected_spent_this_period == 147.98
    assert analysis.details.current_percentage_used == 5.92
    assert analysis.details.projected_percentage_used == 5.92
    assert analysis.details.projected_monthly_spend_delta == 0.0
    assert analysis.details.projected_yearly_spend_delta == 0.0


def test_analyze_transaction_decision_transfer_does_not_raise_budget_usage() -> None:
    user_id = 42
    budget = Budget(id=1, amount=2500.0, period="2026-03", user_id=user_id)
    transactions = _sample_transactions(user_id)
    mock_db = MagicMock()
    mock_db.query.side_effect = _build_query_side_effect(budget=budget, transactions=transactions)

    analysis = analyze_transaction_decision(
        db=mock_db,
        user_id=user_id,
        request=IntelligenceAnalyzeRequest(
            amount=200.0,
            action_date=date(2026, 3, 15),
            merchant="Transfer to Savings",
            category="Transfer",
            transaction_type="spend",
            frequency="one_time",
        ),
        emit_prediction_metrics=False,
    )

    assert analysis.projected_impact.balance_change == -200.0
    assert analysis.projected_impact.budget_impact == 0.0
    assert analysis.details is not None
    assert analysis.details.current_spent_this_period == 147.98
    assert analysis.details.projected_spent_this_period == 147.98
    assert analysis.details.current_percentage_used == 5.92
    assert analysis.details.projected_percentage_used == 5.92


def test_serialize_history_record_tolerates_invalid_details_payload() -> None:
    record = IntelligenceHistory(
        id=7,
        user_id=42,
        source="intelligence.analyze",
        risk_score=0.2,
        recommendation="Within budget",
        explanation="Stored before the latest details schema tightened.",
        balance_change=-24.99,
        budget_impact=1.5,
        category_effect="Groceries",
        confidence=0.9,
        details={"analysis_type": "transaction_decision", "current_period": "2026-04"},
        created_at=datetime(2026, 4, 15, 12, 0, tzinfo=timezone.utc),
    )

    serialized = serialize_history_record(record)

    assert serialized.id == 7
    assert serialized.details is None
    assert serialized.projected_impact.balance_change == -24.99


def test_serialize_history_record_tolerates_invalid_json_like_details_string() -> None:
    record = IntelligenceHistory(
        id=8,
        user_id=42,
        source="intelligence.analyze",
        risk_score=0.2,
        recommendation="Within budget",
        explanation="Corrupted details payload.",
        balance_change=-24.99,
        budget_impact=1.5,
        category_effect="Groceries",
        confidence=0.9,
        details="{invalid-json}",
        created_at=datetime(2026, 4, 15, 12, 0, tzinfo=timezone.utc),
    )

    serialized = serialize_history_record(record)

    assert serialized.id == 8
    assert serialized.details is None


def test_safe_parse_details_returns_none_for_bad_payload() -> None:
    parsed = safe_parse_details("not-json", record_id=99)
    assert parsed is None


def test_safe_parse_target_returns_none_for_bad_value() -> None:
    parsed = safe_parse_target("not-a-date", record_id=77)
    assert parsed is None


def test_calculate_financial_health_zero_budget_marks_risk_when_spend_exists() -> None:
    user_id = 42
    budget = Budget(id=1, amount=0.0, period="2026-03", user_id=user_id)
    transactions = [
        Transaction(
            id=1,
            cost=45.0,
            date=date(2026, 3, 5),
            store_name="Trader Joe's",
            category="Groceries",
            user_id=user_id,
        ),
    ]
    mock_db = MagicMock()
    mock_db.query.side_effect = _build_query_side_effect(budget=budget, transactions=transactions)

    result = calculate_financial_health(mock_db, user_id, "2026-03")

    assert result["budget_limit"] == 0.0
    assert result["total_spent"] == 45.0
    assert result["remaining_balance"] == -45.0
    assert result["percentage_used"] == 100.0
    assert result["status"] == "Risk"


def test_normalize_transaction_amount_preserves_positive_transfer_inflows() -> None:
    assert normalize_transaction_amount(150.0, "Transfer") == 150.0
    assert normalize_transaction_amount(-200.0, "Transfer") == -200.0


def test_normalize_transaction_amount_preserves_positive_investment_inflows() -> None:
    assert normalize_transaction_amount(410.0, "Investment") == 410.0
    assert normalize_transaction_amount(-300.0, "Investment") == -300.0


def test_budget_pressure_amount_excludes_non_budget_categories() -> None:
    assert budget_pressure_amount(-200.0, "Transfer") == 0.0
    assert budget_pressure_amount(-300.0, "Investment") == 0.0
    assert budget_pressure_amount(-0.01, "System") == 0.0
    assert budget_pressure_amount(-98.99, "Groceries") == 98.99


def test_list_history_records_skips_malformed_legacy_rows() -> None:
    user_id = 42
    mock_db = MagicMock()

    bad_legacy_record = PredictionResult(
        id=10,
        user_id=user_id,
        created_at=datetime(2026, 4, 15, 9, 0, tzinfo=timezone.utc),
        target_data="not-a-date",
        predicted_spending=123.45,
        expected_savings=67.89,
        confidence_level="not-a-number",
    )
    good_legacy_record = PredictionResult(
        id=11,
        user_id=user_id,
        created_at=datetime(2026, 4, 15, 10, 0, tzinfo=timezone.utc),
        target_data=date(2026, 4, 30),
        predicted_spending=150.0,
        expected_savings=25.0,
        confidence_level=0.8,
    )

    def _query(model, *args, **kwargs):
        query = MagicMock()
        if model is IntelligenceHistory:
            query.filter.return_value.order_by.return_value.limit.return_value.all.return_value = []
        elif model is PredictionResult:
            query.filter.return_value.order_by.return_value.limit.return_value.all.return_value = [
                bad_legacy_record,
                good_legacy_record,
            ]
        else:
            query.filter.return_value.order_by.return_value.limit.return_value.all.return_value = []
        return query

    mock_db.query.side_effect = _query

    records = list_history_records(mock_db, user_id=user_id, limit=10)

    assert len(records) == 1
    assert records[0].id == 11


def test_list_history_records_returns_empty_list_for_empty_db() -> None:
    user_id = 42
    mock_db = MagicMock()

    def _query(model, *args, **kwargs):
        query = MagicMock()
        query.filter.return_value.order_by.return_value.limit.return_value.all.return_value = []
        return query

    mock_db.query.side_effect = _query

    records = list_history_records(mock_db, user_id=user_id, limit=10)

    assert records == []
