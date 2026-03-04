import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware

from backend.api.dependencies.database import get_db
from .models import model_loader
from .routers import index as indexRoute
from .dependencies.config import conf
app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_loader.index()
indexRoute.load_routes(app)

@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "Connected to db successfully"}
    except Exception:
        raise HTTPException(status_code=500, detail="Database connection failed")

if __name__ == "__main__":
    uvicorn.run(app, host=conf.app_host, port=8000)