from unittest.mock import MagicMock, patch

import pytest

from backend.api.models.user import User
from backend.api.unit_testing.conftest import make_test_client, minimal_intelligence_response

from backend.api import prediction as prediction_api

@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock()

@pytest.fixture
def client(mock_db: MagicMock, sample_user: User):
    return make_test_client(
        prediction_api.router,
        mock_db,
        current_user=sample_user,
    )

@patch.object(prediction_api, "cloudwatch")
@patch("backend.api.prediction.build_legacy_predict_response")
@patch("backend.api.prediction.analyze_transaction_decision")
def test_predict_endpoint_cache_miss(
    mock_analyze: MagicMock,
    mock_build: MagicMock,
    mock_cw: MagicMock,
    client: MagicMock,
) -> None:
    prediction_api.CACHE.clear()

    mock_analyze.return_value = minimal_intelligence_response()
    mock_build.return_value = {
        **minimal_intelligence_response().model_dump(mode="json"),
        "cached": False,
        "latency": 0.01,
        "message": "Prediction executed successfully",
    }

    response = client.post(
        "/predict/",
        json={"amount": 20.0, "category": "Food"},
    )
    assert response.status_code == 200
    assert response.json().get("message") == "Prediction executed successfully"
    mock_cw.put_metric_data.assert_called()
    mock_analyze.assert_called_once()
    mock_build.assert_called_once()
