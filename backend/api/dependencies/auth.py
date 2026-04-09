from fastapi import Depends, HTTPException, status
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


def validate_bcrypt_password(password: str) -> None:
    if len(password.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
        raise ValueError(
            "Password cannot be longer than 72 bytes. Please use a shorter password."
        )


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_current_user(
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

    if credentials is None or credentials.scheme.lower() != "bearer":
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
