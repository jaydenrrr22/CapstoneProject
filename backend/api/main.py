import uvicorn
import os
import time
import logging
import uuid
import redis.asyncio as redis
import subprocess

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi_limiter import FastAPILimiter
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse

from .dependencies.database import Base, engine, get_db
from .dependencies.auth import get_current_user
from .dependencies.rate_limit import rate_limit_callback, set_rate_limiter_enabled
from .models import budget, dataset, insight, intelligence, prediction, subscription, transaction, user  # noqa: F401
from .models.user import User
from .routers import index as indexRoute
from .dependencies.config import conf
from .logging_config import setup_logging
from backend.api.prediction import router as prediction_router


# ---------- ENV ----------
ENV = os.getenv("ENV", "development").lower()


# ---------- APP INIT ----------
app = FastAPI(
    docs_url=None if ENV == "production" else "/docs",
    redoc_url=None if ENV == "production" else "/redoc",
    openapi_url=None if ENV == "production" else "/openapi.json",
)

# Include routers
app.include_router(prediction_router)

# Setup logging
app_logger, security_logger = setup_logging()

app.state.app_logger = app_logger
app.state.security_logger = security_logger

logger = app_logger

# Track uptime
START_TIME = time.time()


@app.on_event("startup")
async def on_startup() -> None:
    Base.metadata.create_all(bind=engine)

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
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# ---------- LOAD ROUTES ----------
indexRoute.load_routes(app)


# ---------- REQUEST LOGGING ----------
@app.middleware("http")
async def structured_logging(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    latency = (time.time() - start_time) * 1000

    user_id = None
    if hasattr(request.state, "user"):
        user_id = getattr(request.state.user, "id", None)

    request.app.state.app_logger.info(
        "request_processed",
        extra={
            "user_id": user_id,
            "endpoint": request.url.path,
            "latency": round(latency, 2),
            "ip": request.client.host,
        }
    )

    return response


# ---------- PUBLIC LIVENESS PROBE ----------
@app.get("/healthz", tags=["Health"])
def liveness_probe():
    return {"status": "ok"}


# ---------- HEALTH CHECK (PROTECTED) ----------
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

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Health check failed"
        )


# ---------- EXCEPTION HANDLERS ----------
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    request.app.state.security_logger.warning(
        "http_error",
        extra={
            "endpoint": request.url.path,
            "ip": request.client.host,
            "detail": str(exc.detail)
        }
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "error_type": "HTTP_ERROR",
            "message": exc.detail,
            "path": request.url.path,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request.app.state.security_logger.warning(
        "validation_error",
        extra={
            "endpoint": request.url.path,
            "ip": request.client.host,
            "details": str(exc.errors())
        }
    )
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "error_type": "VALIDATION_ERROR",
            "message": "Invalid input data provided",
            "details": exc.errors(),
            "path": request.url.path,
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request.app.state.security_logger.error(
        "unhandled_exception",
        extra={
            "endpoint": request.url.path,
            "ip": request.client.host,
            "error": str(exc)
        }
    )
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error_type": "Internal Server Error",
            "message": "An unexpected error occurred.",
            "path": request.url.path,
        }
    )


# ---------- VERSION ----------
@app.get("/version", tags=["Health"])
def get_version():
    try:
        commit = subprocess.check_output(
            ["git", "rev-parse", "HEAD"]
        ).decode("utf-8").strip()

        return {
            "status": "ok",
            "version": commit
        }
    except Exception:
        return {
            "status": "error",
            "version": "unknown"
        }


# ---------- LOCAL RUN ----------
if __name__ == "__main__":
    uvicorn.run(app, host=conf.app_host, port=8000)
