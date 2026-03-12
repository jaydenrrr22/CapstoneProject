from sqlalchemy import Column, Float, Integer, ForeignKey, String

from backend.api.dependencies.database import Base


class Budget(Base):
    __tablename__ = "budget"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    amount = Column(Float, nullable=False)
    period = Column(String(50), nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)