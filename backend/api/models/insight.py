from datetime import datetime, timezone
from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, String, Float
from sqlalchemy.orm import relationship

from backend.api.dependencies.database import Base

class AnomalyResult(Base):
    __tablename__ = "anomaly_results"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    transaction_id = Column(Integer, ForeignKey("transaction.id"), nullable=False)

    category = Column(String(255), nullable=False)
    merchant = Column(String(255), nullable=False)
    expected_amount = Column(Float, nullable=False)
    actual_amount = Column(Float, nullable=False)

    anomaly_type = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=lambda : datetime.now(timezone.utc))

    transaction = relationship("Transaction", back_populates="anomaly_results")