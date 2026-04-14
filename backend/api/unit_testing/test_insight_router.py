from datetime import date
from unittest.mock import MagicMock, patch

import pytest

from backend.api.models.user import User
from backend.api.routers import insight as insight_router
from backend.api.unit_testing.conftest import make_test_client

@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock()

@pytest.fixture
def client(mock_db: MagicMock, sample_user: User):
    return make_test_client(
        insight_router.router,
        mock_db,
        current_user=sample_user,
    )

@patch("backend.api.routers.insight.calculate_category_trends")
def test_category_trends(mock_trends: MagicMock, client: MagicMock) -> None:
    mock_trends.return_value = {
        "trends": [
            {
                "category": "Food",
                "current_month_spent": 50.0,
                "previous_month_spent": 40.0,
                "percentage_change": 25.0,
                "trend_direction": "UP",
            }
        ]
    }

    response = client.get("/insight/category-trends")
    assert response.status_code == 200
    assert len(response.json()["trends"]) == 1

@patch("backend.api.routers.insight.detect_spending_anomalies")
def test_anomalies(mock_anom: MagicMock, client: MagicMock) -> None:
    mock_anom.return_value = [
        {
            "category": "Food",
            "merchant": "Cafe",
            "actual_amount": 90.0,
            "expected_amount": 30.0,
            "anomaly_type": "Spike",
            "date": date(2026, 3, 1),
        }
    ]

    response = client.get("/insight/anomalies")
    assert response.status_code == 200
    assert len(response.json()) == 1
