from datetime import date
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.api.models.transaction import Transaction
from backend.api.models.user import User
from backend.api.routers import transaction as transaction_router
from backend.api.unit_testing.conftest import make_test_client

@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock()

@pytest.fixture
def client(mock_db: MagicMock, sample_user: User):
    return make_test_client(
        transaction_router.router,
        mock_db,
        current_user=sample_user,
    )

def test_get_transactions_returns_list(
    client: TestClient,
    mock_db: MagicMock,
    sample_user: User,
) -> None:
    tx = Transaction(
        id=1,
        cost=12.5,
        date=date(2026, 3, 1),
        store_name="Target",
        category="Groceries",
        user_id=sample_user.id,
    )
    q = mock_db.query.return_value
    q.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [
        tx,
    ]

    response = client.get("/transaction/get")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["store_name"] == "Target"

def test_get_transactions_forbidden_other_user(
    mock_db: MagicMock,
    sample_user: User,
) -> None:
    client = make_test_client(
        transaction_router.router,
        mock_db,
        current_user=sample_user,
    )
    response = client.get(f"/transaction/get/{sample_user.id + 1}")
    assert response.status_code == 403

@patch("backend.api.routers.transaction.sync_user_subscriptions")
@patch("backend.api.routers.transaction.clear_prediction_cache")
def test_create_transaction_resolves_category_from_merchant(
    _clear_cache: MagicMock,
    mock_sync_subscriptions: MagicMock,
    client: TestClient,
    mock_db: MagicMock,
    sample_user: User,
) -> None:
    def _refresh(obj: Transaction) -> None:
        obj.id = 100
        obj.user_id = sample_user.id

    mock_db.refresh.side_effect = _refresh

    response = client.post(
        "/transaction/create",
        json={
            "cost": 5.0,
            "date": "2026-03-15",
            "store_name": "Starbucks",
            "category": "Other",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["category"] == "Dining"
    mock_sync_subscriptions.assert_called_once_with(mock_db, sample_user.id)
    _clear_cache.assert_called_once()

def test_delete_transaction_not_found(client: TestClient, mock_db: MagicMock) -> None:
    mock_db.query.return_value.filter.return_value.first.return_value = None
    response = client.delete("/transaction/delete/999")
    assert response.status_code == 404

def test_delete_transaction_forbidden_other_user(
    client: TestClient,
    mock_db: MagicMock,
    sample_user: User,
) -> None:
    other_tx = Transaction(
        id=1,
        cost=1.0,
        date=date(2026, 1, 1),
        store_name="x",
        category="c",
        user_id=sample_user.id + 1,
    )
    mock_db.query.return_value.filter.return_value.first.return_value = other_tx
    response = client.delete("/transaction/delete/1")
    assert response.status_code == 403

def test_create_transaction_rejects_negative_cost(client: TestClient) -> None:
    response = client.post(
        "/transaction/create",
        json={
            "cost": -5.0,
            "date": "2026-03-15",
            "store_name": "Target",
            "category": "Groceries",
        },
    )

    assert response.status_code == 422
