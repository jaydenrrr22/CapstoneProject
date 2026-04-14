from datetime import date
from unittest.mock import MagicMock, patch

import pytest

from backend.api.models.subscription import Subscription
from backend.api.models.user import User
from backend.api.routers import summary as summary_router
from backend.api.unit_testing.conftest import make_test_client

@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock()

@pytest.fixture
def client(mock_db: MagicMock, sample_user: User):
    return make_test_client(
        summary_router.router,
        mock_db,
        current_user=sample_user,
    )

@patch("backend.api.routers.summary.build_forecast_detail")
@patch("backend.api.routers.summary.build_health_score_detail")
def test_unified_summary(
    mock_health: MagicMock,
    mock_forecast: MagicMock,
    client: MagicMock,
    mock_db: MagicMock,
    sample_user: User,
) -> None:
    mock_health.return_value = {
        "score": 75,
        "status": "Good",
        "recommendation": "Keep going",
    }
    mock_forecast.return_value = {
        "predicted_spend": 300.0,
        "expected_savings": 50.0,
        "target_date": date(2026, 3, 31),
    }

    sub = Subscription(
        id=1,
        user_id=sample_user.id,
        merchant="Netflix",
        amount=15.99,
        frequency="monthly",
        is_duplicate=False,
        transaction_id=[1, 2],
    )

    q = MagicMock()
    f = MagicMock()
    q.filter.return_value = f
    f.count.return_value = 1
    f.offset.return_value.limit.return_value.all.return_value = [sub]
    mock_db.query.return_value = q

    response = client.get("/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["user_id"] == sample_user.id
    assert body["total_subscriptions_count"] == 1
    assert len(body["active_subscriptions"]) == 1
    assert body["active_subscriptions"][0]["merchant"] == "Netflix"
