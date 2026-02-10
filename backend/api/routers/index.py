from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..models.user import User
from backend.api.dependencies.database import get_db

router = APIRouter()

@router.get("/ping")
def ping(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return {"status": "ok", "user_count": len(users)}

def load_routes(app):
    app.include_router(router)

