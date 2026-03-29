from pydantic import BaseModel


class FinancialHealthResponse(BaseModel):
    period: str
    score: int
    budget_limit: float
    total_spent: float
    remaining_balance: float
    percentage_used: float
    status: str