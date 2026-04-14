from __future__ import annotations
import fastapi_limiter.depends as _fastapi_limiter_dep

_original_rate_limiter = _fastapi_limiter_dep.RateLimiter

def _rate_limiter_factory(*, times: int, seconds: int):
    try:
        return _original_rate_limiter(times=times, seconds=seconds)
    except TypeError:
        from pyrate_limiter import Duration, Limiter, Rate

        return _original_rate_limiter(
            limiter=Limiter(Rate(times, Duration.SECOND * seconds)),
        )

_fastapi_limiter_dep.RateLimiter = _rate_limiter_factory

from datetime import datetime, timezone
from typing import Iterator
from unittest.mock import MagicMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.dependencies.rate_limit import set_rate_limiter_enabled
from backend.api.models.user import User
from backend.api.schemas.intelligence import (
    IntelligenceProjectedImpact,
    IntelligenceResponse,
)

@pytest.fixture(autouse=True)
def _disable_rate_limiter() -> Iterator[None]:
    set_rate_limiter_enabled(False)
    yield
    set_rate_limiter_enabled(False)

@pytest.fixture(autouse=True)
def secret_key_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(
        "SECRET_KEY",
        "test-secret-key-for-pytest-minimum-32-characters",
    )

@pytest.fixture
def sample_user() -> User:
    return User(
        id=42,
        name="Test User",
        email="test@example.com",
        hashed_password="dummy-hash",
    )

def override_db(mock_db: MagicMock):
    def _get_db() -> Iterator[MagicMock]:
        yield mock_db

    return _get_db

def make_test_client(
    router,
    mock_db: MagicMock,
    *,
    current_user: User | None = None,
    router_kwargs: dict | None = None,
) -> TestClient:
    app = FastAPI()
    app.include_router(router, **(router_kwargs or {}))
    app.dependency_overrides[get_db] = override_db(mock_db)

    if current_user is not None:
        app.dependency_overrides[get_current_user] = lambda: current_user
    return TestClient(app)

def minimal_intelligence_response() -> IntelligenceResponse:
    return IntelligenceResponse(
        risk_score=0.5,
        recommendation="Proceed",
        explanation="Test explanation.",
        projected_impact=IntelligenceProjectedImpact(
            balance_change=-10.0,
            budget_impact=5.0,
            category_effect="General",
        ),
        confidence=0.85,
        timestamp=datetime.now(timezone.utc),
    )
