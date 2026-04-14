from unittest.mock import MagicMock

import pytest

from backend.api.models.subscription import Subscription
from backend.api.models.transaction import Transaction
from backend.api.models.user import User
from backend.api.routers import subscription as subscription_router
from backend.api.unit_testing.conftest import make_test_client

@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock()

@pytest.fixture
def client(mock_db: MagicMock, sample_user: User):
    return make_test_client(
        subscription_router.router,
        mock_db,
        current_user=sample_user,
    )

def test_detect_subscriptions_empty_transactions(
    client: MagicMock,
    mock_db: MagicMock,
) -> None:
    def _query(model, *a, **kw):
        m = MagicMock()
        if model is Transaction:
            m.filter.return_value.order_by.return_value.all.return_value = []
        elif model is Subscription:
            m.filter.return_value.all.return_value = []
        return m

    mock_db.query.side_effect = _query

    response = client.get("/subscription/detect")
    assert response.status_code == 200
    assert response.json() == []
