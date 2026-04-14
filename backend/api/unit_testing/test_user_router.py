from unittest.mock import MagicMock, patch

import pytest

from backend.api.models.user import User
from backend.api.routers import user as user_router
from backend.api.unit_testing.conftest import make_test_client

@pytest.fixture(autouse=True)
def clear_failed_login_state() -> None:
    user_router.FAILED_LOGINS.clear()
    yield
    user_router.FAILED_LOGINS.clear()

@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock()

@patch("backend.api.routers.user.get_password_hash", return_value="stub-bcrypt-hash")
def test_register_returns_created_user(
    _mock_hash: MagicMock,
    mock_db: MagicMock,
) -> None:
    mock_db.query.return_value.filter.return_value.first.return_value = None

    def _refresh(user: User) -> None:
        user.id = 1

    mock_db.refresh.side_effect = _refresh

    client = make_test_client(user_router.router, mock_db)
    response = client.post(
        "/auth/register",
        json={
            "name": "Ada",
            "email": "ada@example.com",
            "password": "secret123",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 1
    assert body["email"] == "ada@example.com"
    assert body["name"] == "Ada"
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called()

def test_register_rejects_duplicate_email(mock_db: MagicMock) -> None:
    existing = User(
        id=99,
        name="Other",
        email="taken@example.com",
        hashed_password="hash",
    )
    mock_db.query.return_value.filter.return_value.first.return_value = existing

    client = make_test_client(user_router.router, mock_db)
    response = client.post(
        "/auth/register",
        json={
            "name": "Ada",
            "email": "taken@example.com",
            "password": "secret123",
        },
    )
    assert response.status_code == 400
    assert "registered" in response.json()["detail"].lower()

@patch("backend.api.routers.user.verify_password", return_value=True)
def test_login_returns_token(_mock_verify: MagicMock, mock_db: MagicMock) -> None:
    user = User(
        id=7,
        name="Login",
        email="login@example.com",
        hashed_password="any-stored-hash",
    )
    mock_db.query.return_value.filter.return_value.first.return_value = user

    client = make_test_client(user_router.router, mock_db)
    response = client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "secret123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert "access_token" in data and data["access_token"]

@patch("backend.api.routers.user.verify_password", return_value=False)
def test_login_rejects_invalid_credentials(
    _mock_verify: MagicMock,
    mock_db: MagicMock,
) -> None:
    user = User(
        id=7,
        name="Login",
        email="login@example.com",
        hashed_password="any-stored-hash",
    )
    mock_db.query.return_value.filter.return_value.first.return_value = user

    client = make_test_client(user_router.router, mock_db)
    response = client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "wrong-password"},
    )
    assert response.status_code == 401
