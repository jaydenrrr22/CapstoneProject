from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.dataset import DatasetTemplate, DatasetTransaction
from backend.api.models.transaction import Transaction
from backend.api.models.user import User
from backend.api.schemas.dataset import DatasetTemplateResponse, ApplyDatasetResponse

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("/", response_model=List[DatasetTemplateResponse])
def get_dataset_templates(db: Session = Depends(get_db)):
    templates = db.query(DatasetTemplate).all()
    return templates

@router.post("/{template_id}/apply", response_model=ApplyDatasetResponse)
def apply_dataset(
        template_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    template = db.query(DatasetTemplate).filter(DatasetTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    existing_tx_count = db.query(Transaction).filter(Transaction.user_id == current_user.id).count()
    if existing_tx_count > 0:
        raise HTTPException(status_code=400, detail="User already has transactions, Cannot apply template.")

    template_txs = db.query(DatasetTransaction).filter(DatasetTransaction.id == template_id).all()

    if not template_txs:
        return ApplyDatasetResponse(message="Template has no transactions.", transactions_added=0)

    new_transactions = []
    today = datetime.utcnow()
    for t_tx in template_txs:
        tx_date = today + timedelta(days = t_tx.day_offset)

        new_tx = Transaction(
            user_id = current_user.id,
            store_name=t_tx.store_name,
            category=t_tx.category,
            cost=t_tx.cost,
            date=tx_date,
        )
        new_transactions.append(new_tx)

    db.add_all(new_transactions)
    db.commit()

    return ApplyDatasetResponse(
        message=f"Template '{template.name}' applied successfully.",
        transactions_added=len(new_transactions)
    )