from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, JSON

from backend.api.dependencies.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    merchant = Column(String(100), index=True)
    amount = Column(Float)
    frequency = Column(String(50))
    is_duplicate = Column(Boolean, default=False)
    is_confirmed = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    transaction_id = Column(JSON, nullable=False)