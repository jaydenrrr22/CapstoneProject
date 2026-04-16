from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import extract
from sqlalchemy.orm import Session
from starlette import status

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.database import get_db
from backend.api.models.budget import Budget
from backend.api.models.transaction import Transaction
from backend.api.models.user import User
from backend.api.schemas.budget import BudgetResponse, BudgetCreate, MonthlyProgressResponse
from backend.api.services.finance_logic import (
    budget_pressure_amount,
    calculate_budget_usage_percentage,
)

router = APIRouter(prefix="/budget", tags=["Budget"])

@router.post("/create", response_model=BudgetResponse,
             status_code=status.HTTP_201_CREATED)
def create_budget(
        budget: BudgetCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    existing_budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.period == budget.period,
    ).first()

    if existing_budget:
        raise HTTPException(status_code=400, detail="Budget for this period already exists")

    new_budget = Budget(
        amount=budget.amount,
        period=budget.period,
        user_id=current_user.id,
    )

    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget

@router.get("/get", response_model=List[BudgetResponse])
def get_user_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Budget).filter(Budget.user_id == current_user.id).all()

@router.put("/update/{budget_id}", response_model=BudgetResponse)
def update_budget(
        budget_id: int,
        budget_update: BudgetCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    budget.amount = budget_update.amount
    budget.period = budget_update.period

    db.commit()
    db.refresh(budget)
    return budget

@router.delete("/delete/{budget_id}", status_code=status.HTTP_200_OK)
def delete_budget(
        budget_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    db.delete(budget)
    db.commit()
    return {"detail": f"Successfully deleted budget {budget_id}"}

@router.get("/progress/{period}", response_model=MonthlyProgressResponse)
def get_monthly_progress(
        period: str,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.period == period,
    ).first()

    if not budget:
        raise HTTPException(status_code=404, detail=f"No budget for period {period}")

    try:
        target_year, target_month = map(int, period.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Period must be in the format YYYY-MM")

    period_transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        extract('year', Transaction.date) == target_year,
        extract('month', Transaction.date) == target_month,
    ).all()

    total_spent = sum(
        budget_pressure_amount(transaction.cost, transaction.category)
        for transaction in period_transactions
    )

    remaining_balance = budget.amount - total_spent
    effective_spend = max(total_spent, 0)
    percentage_used = calculate_budget_usage_percentage(effective_spend, budget.amount)

    if percentage_used >= 90:
        status = "Risk"
    elif percentage_used >= 70:
        status = "Moderate"
    else:
        status = "Good"

    return {
        "month": period,
        "budget_limit": round(budget.amount, 2),
        "total_spent": round(total_spent, 2),
        "remaining_balance": round(remaining_balance, 2),
        "percentage_used": round(percentage_used, 2),
        "status": status,
    }
