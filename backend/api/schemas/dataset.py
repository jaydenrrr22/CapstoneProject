from pydantic import BaseModel


class DatasetTemplateResponse(BaseModel):
    id: int
    name: str
    description: str | None = None

    class Config:
        from_attributes = True

class ApplyDatasetResponse(BaseModel):
    message: str
    transactions_added: int