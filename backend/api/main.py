import uvicorn
import os
import time
import logging
import uuid
import redis.asyncio as redis

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi_limiter import FastAPILimiter
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware

from .dependencies.database import get_db
from .dependencies.auth import get_current_user
from .dependencies.rate_limit import rate_limit_callback, set_rate_limiter_enabled
from .models import model_loader
from .models.user import User
from .routers import index as indexRoute
from .dependencies.config import conf
from .logging_config import setup_logging
from backend.api.prediction import router as prediction_router


# ---------- APP INIT ----------
app = FastAPI()

# Include routers
app.include_router(prediction_router)

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Track uptime
START_TIME = time.time()


@app.on_event("startup")
async def on_startup() -> None:
    try:
        redis_client = redis.from_url(
            conf.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
        await redis_client.ping()
        await FastAPILimiter.init(redis_client, http_callback=rate_limit_callback)
        app.state.redis = redis_client
        set_rate_limiter_enabled(True)
        logger.info("Rate limiting enabled with Redis backend")
    except Exception as exc:
        app.state.redis = None
        set_rate_limiter_enabled(False)
        logger.warning("Redis unavailable; rate limiting disabled: %s", exc)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    redis_client = getattr(app.state, "redis", None)
    if redis_client is not None:
        await redis_client.close()


# ---------- SECURE CORS CONFIG ----------
ALLOWED_ORIGINS = [
    "https://3.151.137.239",
    "https://ec2-3-151-137-239.us-east-2.compute.amazonaws.com",
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# ---------- LOAD MODELS / ROUTES ----------
model_loader.index()
indexRoute.load_routes(app)


# ---------- REQUEST LOGGING MIDDLEWARE ----------
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())

    logger.info(
        f"Incoming request {request.method} {request.url.path}",
        extra={"request_id": request_id}
    )

    response = await call_next(request)

    logger.info(
        f"Completed request {request.method} {request.url.path} status={response.status_code}",
        extra={"request_id": request_id}
    )

    return response


# ---------- HEALTH CHECK ----------
@app.get("/health", tags=["Health"])
def health_check(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
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


# ---------- LOCAL RUN ----------
if __name__ == "__main__":
    uvicorn.run(app, host=conf.app_host, port=8000)
