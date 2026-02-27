from typing import List, Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from starlette import status

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.schemas.transaction import TransactionResponse, TransactionCreate
from backend.api.models.transaction import Transaction

router = APIRouter(prefix="/transaction", tags=["Transaction"])

@router.get("/get", response_model=List[TransactionResponse])
def get_transactions(db: Session = Depends(get_db)):
    transactions = db.query(Transaction).limit(50).all()
    return transactions

@router.post("/create", response_model=TransactionResponse, status_code = status.HTTP_201_CREATED)
def create_transaction(
        transaction: TransactionCreate,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    new_transaction = Transaction(
        cost = transaction.cost,
        date = transaction.date,
        store_name = transaction.store_name,
        category = transaction.category,
        user_id = current_user.id,
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction