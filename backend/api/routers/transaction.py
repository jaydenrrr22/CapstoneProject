import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from starlette import status

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.user import User
from backend.api.schemas.transaction import TransactionResponse, TransactionCreate
from backend.api.models.transaction import Transaction
from backend.api.services.finance_logic import normalize_transaction_amount
from backend.api.services.subscription_service import sync_user_subscriptions

#  cache invalidation import
from backend.api.cache import clear_prediction_cache

logger = logging.getLogger(__name__)


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


def _resolve_category(raw_category: str | None, store_name: str) -> str:
    normalized_category = (raw_category or "").strip()

    if normalized_category and normalized_category.lower() != "other":
        return normalized_category

    normalized_merchant = store_name.strip().lower()
    return MERCHANT_CATEGORIES.get(normalized_merchant, "Other")


def _serialize_transaction(transaction: Transaction) -> TransactionResponse:
    return TransactionResponse(
        id=transaction.id,
        cost=normalize_transaction_amount(transaction.cost, transaction.category),
        date=transaction.date,
        store_name=transaction.store_name,
        category=transaction.category,
        user_id=transaction.user_id,
    )


@router.get("/get", response_model=List[TransactionResponse])
def get_transactions(
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(50, ge=1, le=5000, description="Rows per page"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * page_size

    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.date.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return [_serialize_transaction(transaction) for transaction in transactions]


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

    return [_serialize_transaction(transaction) for transaction in transactions]


@router.post("/create", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
        transaction: TransactionCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    final_category = _resolve_category(transaction.category, transaction.store_name)

    new_transaction = Transaction(
        cost=normalize_transaction_amount(transaction.cost, final_category),
        date=transaction.date,
        store_name=transaction.store_name,
        category=final_category,
        user_id=current_user.id,
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    try:
        sync_user_subscriptions(db, current_user.id)
    except Exception:
        logger.exception("Subscription sync failed after transaction create (user=%s)", current_user.id)

    # *** - invalidate prediction cache
    clear_prediction_cache()

    return _serialize_transaction(new_transaction)


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

    try:
        sync_user_subscriptions(db, current_user.id)
    except Exception:
        logger.exception("Subscription sync failed after transaction delete (user=%s)", current_user.id)

    # invalidate cache
    clear_prediction_cache()

    return {"message": f"Successfully deleted transaction {transaction.id}"}


@router.put("/update/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
        transaction_id: int,
        transaction_update: TransactionCreate,
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
            detail="You are not authorized to update this transaction",
        )

    final_category = _resolve_category(
        transaction_update.category,
        transaction_update.store_name,
    )

    transaction.cost = normalize_transaction_amount(transaction_update.cost, final_category)
    transaction.date = transaction_update.date
    transaction.store_name = transaction_update.store_name
    transaction.category = final_category

    db.commit()
    db.refresh(transaction)

    try:
        sync_user_subscriptions(db, current_user.id)
    except Exception:
        logger.exception("Subscription sync failed after transaction update (user=%s)", current_user.id)

    clear_prediction_cache()

    return _serialize_transaction(transaction)
