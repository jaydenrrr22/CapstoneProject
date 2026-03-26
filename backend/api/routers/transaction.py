from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette import status

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.user import User
from backend.api.schemas.transaction import TransactionResponse, TransactionCreate
from backend.api.models.transaction import Transaction

#  cache invalidation import
from backend.api.cache import clear_prediction_cache


MERCHANT_CATEGORIES = {
    "netflix": "Entertainment",
    "spotify": "Entertainment",
    "target": "Groceries",
    "walmart": "Groceries",
    "shell": "Gas",
    "exxon": "Gas",
    "uber": "Transportation",
    "mcdonalds": "Dining",
    "starbucks": "Dining"
}

router = APIRouter(prefix="/transaction", tags=["Transaction"])


@router.get("/get", response_model=List[TransactionResponse])
def get_transactions(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.date.desc())
        .limit(50)
        .all()
    )
    return transactions


@router.get("/get/{user_id}", response_model=List[TransactionResponse])
def get_transactions_by_user_id(
        user_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to perform this action",
        )

    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .all()
    )

    return transactions


@router.post("/create", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
        transaction: TransactionCreate,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    final_category = transaction.category
    if not final_category or final_category.strip().lower() == "other":
        normalized_merchant = transaction.store_name.strip().lower()
        final_category = MERCHANT_CATEGORIES.get(normalized_merchant, "Other")

    new_transaction = Transaction(
        cost=transaction.cost,
        date=transaction.date,
        store_name=transaction.store_name,
        category=final_category,
        user_id=current_user.id,
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    # *** - invalidate prediction cache
    clear_prediction_cache()

    return new_transaction


@router.delete("/delete/{transaction_id}", status_code=status.HTTP_200_OK)
def delete_transaction(
        transaction_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id)
        .first()
    )

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    if transaction.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this transaction",
        )

    db.delete(transaction)
    db.commit()

    # invalidate cache
    clear_prediction_cache()

    return {"message": f"Successfully deleted transaction {transaction.id}"}
