import importlib
import sys
import types
from unittest.mock import MagicMock, patch

import pytest

from backend.api.models.user import User
from backend.api.schemas.intelligence import IntelligenceHistoryResponse
from backend.api.unit_testing.conftest import make_test_client, minimal_intelligence_response

# `backend.api.routers.prediction` imports churn_model at module import time.
# Stub it so tests don't require heavy optional ML deps (e.g. pandas).
if "backend.api.services.churn_model" not in sys.modules:
    churn_stub = types.ModuleType("backend.api.services.churn_model")
    churn_stub.predict_churn_from_input = lambda payload: 50.0
    sys.modules["backend.api.services.churn_model"] = churn_stub

prediction_router = importlib.import_module("backend.api.routers.prediction")

@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock()

@pytest.fixture
def client(mock_db: MagicMock, sample_user: User):
    return make_test_client(
        prediction_router.router,
        mock_db,
        current_user=sample_user,
    )

@patch("backend.api.routers.prediction.list_history_records")
def test_get_prediction_history(mock_list: MagicMock, client: MagicMock) -> None:
    mock_list.return_value = []
    response = client.get("/prediction/history")
    assert response.status_code == 200
    assert response.json() == []

@patch("backend.api.routers.prediction.save_history_record")
def test_create_prediction_history(mock_save: MagicMock, client: MagicMock) -> None:
    base = minimal_intelligence_response()
    mock_save.return_value = IntelligenceHistoryResponse(
        **base.model_dump(),
        id=1,
        source="unit.test",
    )

    payload = {
        **base.model_dump(mode="json"),
        "source": "unit.test",
    }
    response = client.post("/prediction/history", json=payload)
    assert response.status_code == 201
    assert response.json()["id"] == 1
    mock_save.assert_called_once()

@patch("backend.api.routers.prediction.delete_history_records")
def test_delete_prediction_history(mock_delete: MagicMock, client: MagicMock) -> None:
    mock_delete.return_value = 3
    response = client.delete("/prediction/history?days_to_keep=30")
    assert response.status_code == 200
    assert response.json()["deleted_count"] == 3
