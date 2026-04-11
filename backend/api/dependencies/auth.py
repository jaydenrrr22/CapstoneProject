import os

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from backend.api.core.security import create_access_token, verify_token
from backend.api.models.user import User
from backend.api.dependencies.database import get_db

security = HTTPBearer(auto_error=False)

# Use passlib for consistent bcrypt handling
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MAX_BCRYPT_PASSWORD_BYTES = 72
DEMO_AUTH_BYPASS_ENABLED = os.getenv("TRACE_ENABLE_DEMO_AUTH_BYPASS", "").strip().lower() == "true"
DEMO_USER_ID = int(os.getenv("TRACE_DEMO_USER_ID", "999"))


def validate_bcrypt_password(password: str) -> None:
    if len(password.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
        raise ValueError(
            "Password cannot be longer than 72 bytes. Please use a shorter password."
        )


def get_password_hash(password: str) -> str:
    try:
        if not isinstance(password, str):
            password = str(password)

        safe_password = password[:72] 
        return pwd_context.hash(safe_password)

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Password processing error"
        )

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if not isinstance(plain_password, str):
            plain_password = str(plain_password)

        # truncate for bcrypt safety
        safe_password = plain_password[:72]

        return pwd_context.verify(safe_password, hashed_password)

    except Exception:
        #  CRITICAL: never crash login
        return False

def get_current_user(
        request: Request,
        credentials: HTTPAuthorizationCredentials | None = Depends(security),
        db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "error": "authentication_failed",
            "message": "Bearer token is missing, invalid, or expired",
        },
        headers={"WWW-Authenticate": "Bearer"},
    )

    has_bearer_credentials = credentials is not None and credentials.scheme.lower() == "bearer"

    if (
        DEMO_AUTH_BYPASS_ENABLED
        and not has_bearer_credentials
        and request.headers.get("X-Trace-Demo-Mode", "").strip().lower() == "true"
    ):
        return User(
            id=DEMO_USER_ID,
            email="demo@trace.local",
            name="Demo User",
            hashed_password="demo-mode",
        )

    if not has_bearer_credentials:
        raise credentials_exception

    token = credentials.credentials
    if not token:
        raise credentials_exception

    try:
        payload = verify_token(token)
        user_id = payload.get("sub") or payload.get("user_id")
        if user_id is None:
            raise credentials_exception
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise credentials_exception

    return user
