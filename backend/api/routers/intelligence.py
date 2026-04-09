from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.user import User
from backend.api.schemas.intelligence import IntelligenceAnalyzeRequest, IntelligenceResponse
from backend.api.services.intelligence_service import analyze_transaction_decision

from fastapi import Request, HTTPException
from collections import defaultdict
from time import time
from backend.api.security_logger import log_security_event

REQUEST_TRACKER = defaultdict(list)
SUSPICIOUS_IPS = set()

REQUEST_LIMIT = 20
REQUEST_WINDOW = 10  # seconds

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])


@router.post("/analyze", response_model=IntelligenceResponse)
def analyze_intelligence(
    request: IntelligenceAnalyzeRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client_ip = http_request.client.host
    current_time = time()

    # Clean old requests
    REQUEST_TRACKER[client_ip] = [
        t for t in REQUEST_TRACKER[client_ip]
        if current_time - t < REQUEST_WINDOW
    ]

    # Add current request
    REQUEST_TRACKER[client_ip].append(current_time)

    # Detect abuse
    if len(REQUEST_TRACKER[client_ip]) > REQUEST_LIMIT:
        SUSPICIOUS_IPS.add(client_ip)

        log_security_event(
            "API_ABUSE_DETECTED",
            f"ip={client_ip}, requests={len(REQUEST_TRACKER[client_ip])}"
        )

        raise HTTPException(
            status_code=429,
            detail="Too many requests. Suspicious activity detected."
        )
    return analyze_transaction_decision(
        db=db,
        user_id=current_user.id,
        request=request,
    )

@router.get("/suspicious")
def get_suspicious_ips():
    return {
        "suspicious_ips": list(SUSPICIOUS_IPS),
        "count": len(SUSPICIOUS_IPS)
    }
