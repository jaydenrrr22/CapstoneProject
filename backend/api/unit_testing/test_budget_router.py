from datetime import date
from unittest.mock import MagicMock

import pytest

from backend.api.models.budget import Budget
from backend.api.models.transaction import Transaction
from backend.api.models.user import User
from backend.api.routers import budget as budget_router
from backend.api.unit_testing.conftest import make_test_client

@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock()

@pytest.fixture
def client(mock_db: MagicMock, sample_user: User):
    return make_test_client(
        budget_router.router,
        mock_db,
        current_user=sample_user,
    )

def test_create_budget_success(client: MagicMock, mock_db: MagicMock, sample_user: User) -> None:
    mock_db.query.return_value.filter.return_value.first.return_value = None

    def _refresh(b: Budget) -> None:
        b.id = 1
        b.user_id = sample_user.id

    mock_db.refresh.side_effect = _refresh

    response = client.post(
        "/budget/create",
        json={"amount": 400.0, "period": "2026-03"},
    )
    assert response.status_code == 201
    assert response.json()["period"] == "2026-03"
    mock_db.add.assert_called_once()

def test_create_budget_duplicate_period(client: MagicMock, mock_db: MagicMock, sample_user: User) -> None:
    existing = Budget(id=9, amount=100.0, period="2026-03", user_id=sample_user.id)
    mock_db.query.return_value.filter.return_value.first.return_value = existing

    response = client.post(
        "/budget/create",
        json={"amount": 400.0, "period": "2026-03"},
    )
    assert response.status_code == 400

def test_get_budgets(client: MagicMock, mock_db: MagicMock, sample_user: User) -> None:
    rows = [
        Budget(id=1, amount=100.0, period="2026-02", user_id=sample_user.id),
        Budget(id=2, amount=200.0, period="2026-03", user_id=sample_user.id),
    ]
    mock_db.query.return_value.filter.return_value.all.return_value = rows

    response = client.get("/budget/get")
    assert response.status_code == 200
    assert len(response.json()) == 2

def test_get_monthly_progress(client: MagicMock, mock_db: MagicMock, sample_user: User) -> None:
    budget = Budget(id=1, amount=500.0, period="2026-03", user_id=sample_user.id)
    period_tx = Transaction(
        id=1,
        cost=100.0,
        date=date(2026, 3, 10),
        store_name="Store",
        category="Groceries",
        user_id=sample_user.id,
    )

    def _query(model, *a, **kw):
        m = MagicMock()
        if model is Budget:
            m.filter.return_value.first.return_value = budget
        elif model is Transaction:
            m.filter.return_value.all.return_value = [period_tx]
        return m

    mock_db.query.side_effect = _query

    response = client.get("/budget/progress/2026-03")
    assert response.status_code == 200
    body = response.json()
    assert body["month"] == "2026-03"
    assert body["budget_limit"] == 500.0
    assert body["total_spent"] == 100.0
    assert body["status"] == "Good"

def test_get_monthly_progress_ignores_income(client: MagicMock, mock_db: MagicMock, sample_user: User) -> None:
    budget = Budget(id=1, amount=2500.0, period="2026-03", user_id=sample_user.id)
    period_transactions = [
        Transaction(
            id=1,
            cost=20.0,
            date=date(2026, 3, 2),
            store_name="Spotify",
            category="Subscription - Music",
            user_id=sample_user.id,
        ),
        Transaction(
            id=2,
            cost=20.0,
            date=date(2026, 3, 8),
            store_name="Netflix",
            category="Subscription - Entertainment",
            user_id=sample_user.id,
        ),
        Transaction(
            id=3,
            cost=8.99,
            date=date(2026, 3, 12),
            store_name="iCloud",
            category="Subscription - Storage",
            user_id=sample_user.id,
        ),
        Transaction(
            id=4,
            cost=98.99,
            date=date(2026, 3, 13),
            store_name="Target",
            category="Groceries",
            user_id=sample_user.id,
        ),
        Transaction(
            id=5,
            cost=199.99,
            date=date(2026, 3, 14),
            store_name="Payroll",
            category="Income",
            user_id=sample_user.id,
        ),
    ]

    def _query(model, *a, **kw):
        m = MagicMock()
        if model is Budget:
            m.filter.return_value.first.return_value = budget
        elif model is Transaction:
            m.filter.return_value.all.return_value = period_transactions
        return m

    mock_db.query.side_effect = _query

    response = client.get("/budget/progress/2026-03")
    assert response.status_code == 200
    body = response.json()
    assert body["total_spent"] == 147.98
    assert body["remaining_balance"] == 2352.02
    assert body["percentage_used"] == 5.92


def test_get_monthly_progress_ignores_non_budget_categories(
    client: MagicMock,
    mock_db: MagicMock,
    sample_user: User,
) -> None:
    budget = Budget(id=1, amount=3140.0, period="2026-04", user_id=sample_user.id)
    period_transactions = [
        Transaction(
            id=1,
            cost=120.0,
            date=date(2026, 4, 2),
            store_name="Publix",
            category="Groceries",
            user_id=sample_user.id,
        ),
        Transaction(
            id=2,
            cost=-200.0,
            date=date(2026, 4, 2),
            store_name="Transfer to Savings",
            category="Transfer",
            user_id=sample_user.id,
        ),
        Transaction(
            id=3,
            cost=-300.0,
            date=date(2026, 4, 2),
            store_name="Vanguard Investment Contribution",
            category="Investment",
            user_id=sample_user.id,
        ),
        Transaction(
            id=4,
            cost=-0.01,
            date=date(2026, 4, 2),
            store_name="End of Dataset Marker",
            category="System",
            user_id=sample_user.id,
        ),
    ]

    def _query(model, *a, **kw):
        m = MagicMock()
        if model is Budget:
            m.filter.return_value.first.return_value = budget
        elif model is Transaction:
            m.filter.return_value.all.return_value = period_transactions
        return m

    mock_db.query.side_effect = _query

    response = client.get("/budget/progress/2026-04")

    assert response.status_code == 200
    body = response.json()
    assert body["total_spent"] == 120.0
    assert body["remaining_balance"] == 3020.0
    assert body["percentage_used"] == 3.82

def test_get_monthly_progress_invalid_period(client: MagicMock, mock_db: MagicMock) -> None:
    mock_db.query.return_value.filter.return_value.first.return_value = Budget(
        id=1,
        amount=500.0,
        period="bad",
        user_id=42,
    )

    response = client.get("/budget/progress/bad")
    assert response.status_code == 400

def test_create_budget_rejects_negative_amount(client: MagicMock) -> None:
    response = client.post(
        "/budget/create",
        json={"amount": -1, "period": "2026-03"},
    )

    assert response.status_code == 422

def test_get_monthly_progress_zero_budget_flags_spend_as_risk(
    client: MagicMock,
    mock_db: MagicMock,
    sample_user: User,
) -> None:
    budget = Budget(id=1, amount=0.0, period="2026-03", user_id=sample_user.id)
    period_transactions = [
        Transaction(
            id=1,
            cost=25.0,
            date=date(2026, 3, 3),
            store_name="Grocer",
            category="Groceries",
            user_id=sample_user.id,
        ),
    ]

    def _query(model, *a, **kw):
        m = MagicMock()
        if model is Budget:
            m.filter.return_value.first.return_value = budget
        elif model is Transaction:
            m.filter.return_value.all.return_value = period_transactions
        return m

    mock_db.query.side_effect = _query

    response = client.get("/budget/progress/2026-03")

    assert response.status_code == 200
    body = response.json()
    assert body["budget_limit"] == 0.0
    assert body["total_spent"] == 25.0
    assert body["remaining_balance"] == -25.0
    assert body["percentage_used"] == 100.0
    assert body["status"] == "Risk"
