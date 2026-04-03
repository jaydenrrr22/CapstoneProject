from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text

from backend.api.dependencies.database import Base


class IntelligenceHistory(Base):
    __tablename__ = "intelligence_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    source = Column(String(64), nullable=False, default="intelligence.analyze")

    risk_score = Column(Float, nullable=False)
    recommendation = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    balance_change = Column(Float, nullable=False)
    budget_impact = Column(Float, nullable=False)
    category_effect = Column(String(255), nullable=False)
    confidence = Column(Float, nullable=False)

    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
