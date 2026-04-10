from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.user import User
from backend.api.schemas.intelligence import IntelligenceAnalyzeRequest
from backend.api.schemas.simulation import SimulationRequest, SimulationResponse
from backend.api.services.intelligence_service import (
    analyze_transaction_decision,
    build_legacy_simulation_response,
)

router = APIRouter(prefix="/simulation", tags=["Simulation"])


@router.post(
    "/simulate_purchase",
    response_model=SimulationResponse,
    deprecated=True,
)
def simulate_purchase(
        request: SimulationRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    analysis = analyze_transaction_decision(
        db=db,
        user_id=current_user.id,
        request=IntelligenceAnalyzeRequest(
            amount=request.amount,
            action_date=request.action_date,
            category=request.category,
            transaction_type=request.transaction_type,
            frequency=request.frequency,
            save_to_history=False,
            source="simulation.simulate_purchase",
        ),
    )

    return build_legacy_simulation_response(analysis)
