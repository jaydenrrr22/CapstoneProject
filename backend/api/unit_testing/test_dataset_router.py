from unittest.mock import MagicMock

import pytest

from backend.api.models.dataset import DatasetTemplate
from backend.api.models.transaction import Transaction
from backend.api.models.user import User
from backend.api.routers import dataset as dataset_router
from backend.api.unit_testing.conftest import make_test_client

@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock()

def test_list_dataset_templates_unauthenticated(mock_db: MagicMock) -> None:
    mock_db.query.return_value.all.return_value = []
    client = make_test_client(dataset_router.router, mock_db)
    response = client.get("/datasets/")
    assert response.status_code == 200
    assert response.json() == []

def test_apply_dataset_template_not_found(mock_db: MagicMock, sample_user: User) -> None:
    def _query(model, *a, **kwargs):
        m = MagicMock()
        if model is DatasetTemplate:
            m.filter.return_value.first.return_value = None
        return m

    mock_db.query.side_effect = _query

    client = make_test_client(
        dataset_router.router,
        mock_db,
        current_user=sample_user,
    )
    response = client.post("/datasets/99/apply")
    assert response.status_code == 404

def test_apply_dataset_rejects_when_user_has_transactions(
    mock_db: MagicMock,
    sample_user: User,
) -> None:
    template = MagicMock()
    template.id = 1
    template.name = "Starter"

    def _query(model, *a, **kwargs):
        m = MagicMock()
        if model is DatasetTemplate:
            m.filter.return_value.first.return_value = template
        elif model is Transaction:
            m.filter.return_value.count.return_value = 5
        return m

    mock_db.query.side_effect = _query

    client = make_test_client(
        dataset_router.router,
        mock_db,
        current_user=sample_user,
    )
    response = client.post("/datasets/1/apply")
    assert response.status_code == 400
    assert "already has transactions" in response.json()["detail"].lower()
