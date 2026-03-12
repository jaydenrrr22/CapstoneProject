from pydantic import BaseModel, ConfigDict, Field


class BudgetBase(BaseModel):
    amount: float
    period: str = Field(..., pattern=r"^\d{4}-(0[1-9]|1[0-2])$", examples=["2026-03"])

class BudgetCreate(BudgetBase):
    pass

class BudgetResponse(BudgetBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)

class MonthlyProgressResponse(BaseModel):
    month: str
    budget_limit: float
    total_spent: float
    remaining_balance: float
    percentage_used: float
    status: str