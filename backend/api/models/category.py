from pydantic import BaseModel
from sqlalchemy import Column, Integer, String


class Category(BaseModel):
    __tablename__ = "category"

    id = Column(Integer, autoincrement=True, index=True, primary_key=True)
    name = Column(String(255), nullable=False)