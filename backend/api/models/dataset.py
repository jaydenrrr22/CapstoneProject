from sqlalchemy import Column, String, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship

from backend.api.dependencies.database import Base


class DatasetTemplate(Base):
    __tablename__ = "dataset_template"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))

    transactions = relationship("DatasetTransaction", back_populates="template",
                                cascade="all, delete-orphan")

class DatasetTransaction(Base):
    __tablename__ = "dataset_transaction"
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("dataset_template.id"))

    store_name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    cost = Column(Float, nullable=False)

    day_offset = Column(Integer, nullable=False, default=0)
    template = relationship("DatasetTemplate", back_populates="transactions")

class DatasetBudget(Base):
    __tablename__ = "dataset_budget"
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("dataset_template.id",
                                             ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    period = Column(String(50), nullable=False)