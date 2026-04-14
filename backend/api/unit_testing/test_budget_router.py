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

def test_get_monthly_progress_invalid_period(client: MagicMock, mock_db: MagicMock) -> None:
    mock_db.query.return_value.filter.return_value.first.return_value = Budget(
        id=1,
        amount=500.0,
        period="bad",
        user_id=42,
    )

    response = client.get("/budget/progress/bad")
    assert response.status_code == 400
