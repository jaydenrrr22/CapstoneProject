import uvicorn
import os
import time
import logging
import uuid
from fastapi import FastAPI, Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware

from .dependencies.database import get_db
from .models import model_loader
from .routers import index as indexRoute
from .dependencies.config import conf
from .logging_config import setup_logging

app = FastAPI()

setup_logging()
logger = logging.getLogger(__name__)

START_TIME = time.time()

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


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())

    logger.info(
        f"Incoming request {request.url}",
        extra={"request_id": request_id}
    )

    response = await call_next(request)

    logger.info(
        f"Completed request {request.url}",
        extra={"request_id": request_id}
    )

    return response


@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))

        pid = os.getpid()
        uptime = round(time.time() - START_TIME, 2)

        return {
            "status": "healthy",
            "database": "connected",
            "backend_pid": pid,
            "uptime_seconds": uptime
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(app, host=conf.app_host, port=8000)
