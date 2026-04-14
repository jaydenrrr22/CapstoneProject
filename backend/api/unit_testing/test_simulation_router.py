from unittest.mock import MagicMock, patch

import pytest

from backend.api.models.user import User
from backend.api.routers import simulation as simulation_router
from backend.api.schemas.simulation import SimulationResponse, SimulationScenario
from backend.api.unit_testing.conftest import make_test_client

@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock()

@pytest.fixture
def client(mock_db: MagicMock, sample_user: User):
    return make_test_client(
        simulation_router.router,
        mock_db,
        current_user=sample_user,
    )

@patch("backend.api.routers.simulation.build_legacy_simulation_response")
@patch("backend.api.routers.simulation.analyze_transaction_decision")
def test_simulate_purchase_returns_legacy_payload(
    mock_analyze: MagicMock,
    mock_legacy: MagicMock,
    client: MagicMock,
) -> None:
    mock_legacy.return_value = SimulationResponse(
        projected_monthly_cost=10.0,
        projected_yearly_cost=120.0,
        current_monthly_budget=500.0,
        current_spent_this_period=100.0,
        projected_spent_this_period=110.0,
        current_percentage_used=20.0,
        projected_percentage_used=22.0,
        remaining_budget_after_purchase=390.0,
        risk_level="Good",
        confidence_level=0.85,
        recommendation="ok",
        scenarios=[
            SimulationScenario(
                scenario_type="base",
                projected_spent_this_period=110.0,
                remaining_budget_after_purchase=390.0,
                projected_percentage_used=22.0,
                risk_level="Good",
            )
        ],
    ).model_dump()

    response = client.post(
        "/simulation/simulate_purchase",
        json={
            "amount": 10.0,
            "frequency": "monthly",
        },
    )
    assert response.status_code == 200
    mock_analyze.assert_called_once()
    mock_legacy.assert_called_once()
