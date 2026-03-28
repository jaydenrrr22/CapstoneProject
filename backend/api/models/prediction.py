from datetime import timezone, datetime

from sqlalchemy import Column, Integer, ForeignKey, DateTime, Date, Float

from backend.api.dependencies.database import Base


class PredictionResult(Base):
    __tablename__ = "prediction_result"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)

    created_at = Column(DateTime, default = lambda: datetime.now(timezone.utc))

    target_data = Column(Date)
    predicted_spending = Column(Float)
    expected_savings=Column(Float)
    confidence_level = Column(Float)