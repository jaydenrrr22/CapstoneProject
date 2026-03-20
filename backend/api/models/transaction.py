from sqlalchemy import Column, Integer, Float, Date, String, ForeignKey
from backend.api.dependencies.database import Base


class Transaction(Base):
    __tablename__ = "transaction"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cost = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    store_name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # category = Column(Integer, ForeignKey("categories.id"), nullable=False)