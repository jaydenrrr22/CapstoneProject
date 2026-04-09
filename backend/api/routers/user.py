from datetime import datetime, timedelta

from fastapi import Request
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from backend.api.core.security import create_access_token
from backend.api.dependencies.auth import (
    get_password_hash,
    verify_password,
)
from backend.api.dependencies.database import get_db
from backend.api.dependencies.rate_limit import get_rate_limit_dependency
from backend.api.models.dataset import DatasetTransaction
from backend.api.models.transaction import Transaction
from backend.api.models.user import User
from backend.api.schemas.user import UserResponse, UserCreate, Token, UserLogin

from backend.api.security_logger import log_security_event

from collections import defaultdict
from time import time

FAILED_LOGINS = defaultdict(list)
MAX_ATTEMPTS = 5
LOCKOUT_TIME = 300  # 5 minutes

router = APIRouter(prefix="/auth", tags=["User"])


@router.post(
    "/register",
    response_model=UserResponse,
    dependencies=[Depends(get_rate_limit_dependency(times=3, seconds=60))],
    status_code=status.HTTP_201_CREATED,
)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = get_password_hash(user.password)

    new_user = User(name=user.name, email=str(user.email), hashed_password=hashed_pw)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if getattr(user, "dataset_id", None) is not None:
        template_txs = db.query(DatasetTransaction).filter(
            DatasetTransaction.template_id == user.dataset_id
        ).all()

        if template_txs:
            new_transactions = []
            today = datetime.utcnow()

            for t_tx in template_txs:
                tx_date = today + timedelta(days=t_tx.day_offset)

                new_tx = Transaction(
                    user_id=new_user.id,
                    store_name=t_tx.store_name,
                    category=t_tx.category,
                    cost=t_tx.cost,
                    date=tx_date,
                )
                new_transactions.append(new_tx)

            db.add_all(new_transactions)
            db.commit()

    return new_user


@router.post(
    "/login",
    response_model=Token,
    dependencies=[Depends(get_rate_limit_dependency(times=5, seconds=60))],
)
def login(user_credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host
    current_time = time()

    # Clean old attempts
    FAILED_LOGINS[client_ip] = [
        t for t in FAILED_LOGINS[client_ip]
        if current_time - t < LOCKOUT_TIME
    ]

    # Lockout check
    if len(FAILED_LOGINS[client_ip]) >= MAX_ATTEMPTS:
        log_security_event(
            "LOCKOUT",
            f"ip={client_ip}, attempts={len(FAILED_LOGINS[client_ip])}",
        )
        raise HTTPException(
            status_code=429,
            detail="Too many failed login attempts. Try again later.",
        )

    user = db.query(User).filter(User.email == user_credentials.email).first()

    # FAILED LOGIN
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        FAILED_LOGINS[client_ip].append(current_time)

        log_security_event(
            "FAILED_LOGIN",
            f"ip={client_ip}, email={user_credentials.email}",
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # SUCCESS LOGIN
    FAILED_LOGINS[client_ip].clear()

    log_security_event(
        "SUCCESSFUL_LOGIN",
        f"ip={client_ip}, user_id={user.id}",
    )

    access_token = create_access_token(data={"sub": str(user.id)})

    return {"access_token": access_token, "token_type": "bearer"}
