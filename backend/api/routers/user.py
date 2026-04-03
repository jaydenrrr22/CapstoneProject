from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from backend.api.core.security import create_access_token
from backend.api.dependencies.auth import (
    get_password_hash,
    validate_bcrypt_password,
    verify_password,
)
from backend.api.dependencies.database import get_db
from backend.api.dependencies.rate_limit import get_rate_limit_dependency
from backend.api.models.dataset import DatasetTransaction
from backend.api.models.transaction import Transaction
from backend.api.models.user import User
from backend.api.schemas.user import UserResponse, UserCreate, Token, UserLogin

router = APIRouter(prefix="/auth", tags=["User"])

@router.post("/register", response_model=UserResponse,
             dependencies=[Depends(get_rate_limit_dependency(times=3, seconds=60))],
             status_code = status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        hashed_pw = get_password_hash(user.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    new_user = User(name=user.name, email=str(user.email), hashed_password=hashed_pw)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if getattr(user, "dataset_id", None) is not None:
        template_txs = db.query(DatasetTransaction).filter(
            DatasetTransaction.template_id == user.dataset_id
        ).all()

        if template_txs:
            new_tranaction = []
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
                new_tranaction.append(new_tx)

            db.add_all(new_tranaction)
            db.commit()

    return new_user

@router.post(
    "/login",
    response_model=Token,
    dependencies=[Depends(get_rate_limit_dependency(times=5, seconds=60))],
)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    try:
        validate_bcrypt_password(user_credentials.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    user = db.query(User).filter(User.email == user_credentials.email).first()

    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Incorrect email or password",
                            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}
