from unittest.mock import MagicMock, patch

import pytest

from backend.api.models.user import User
from backend.api.routers import intelligence as intelligence_router
from backend.api.unit_testing.conftest import make_test_client, minimal_intelligence_response

@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock()

@pytest.fixture
def client(mock_db: MagicMock, sample_user: User):
    return make_test_client(
        intelligence_router.router,
        mock_db,
        current_user=sample_user,
    )

@patch("backend.api.routers.intelligence.analyze_transaction_decision")
def test_analyze_intelligence(mock_analyze: MagicMock, client: MagicMock) -> None:
    mock_analyze.return_value = minimal_intelligence_response()

    response = client.post(
        "/intelligence/analyze",
        json={
            "amount": 25.0,
            "frequency": "one_time",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["recommendation"] == "Proceed"
    mock_analyze.assert_called_once()
