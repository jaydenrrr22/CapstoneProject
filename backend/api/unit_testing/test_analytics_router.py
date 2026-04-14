from unittest.mock import MagicMock, patch

import pytest

from backend.api.models.user import User
from backend.api.routers import analytics as analytics_router
from backend.api.unit_testing.conftest import make_test_client

@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock()

@pytest.fixture
def client(mock_db: MagicMock, sample_user: User):
    return make_test_client(
        analytics_router.router,
        mock_db,
        current_user=sample_user,
    )

@patch("backend.api.routers.analytics.calculate_financial_health")
def test_financial_health(mock_health: MagicMock, client: MagicMock) -> None:
    mock_health.return_value = {
        "period": "2026-03",
        "score": 80,
        "budget_limit": 500.0,
        "total_spent": 100.0,
        "remaining_balance": 400.0,
        "percentage_used": 20.0,
        "status": "Good",
    }

    response = client.get("/analytics/financial-health/2026-03")
    assert response.status_code == 200
    assert response.json()["score"] == 80
    mock_health.assert_called_once()
