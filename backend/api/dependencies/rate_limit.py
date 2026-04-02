import math
from typing import Callable

from fastapi import HTTPException, Request, Response
from fastapi_limiter.depends import RateLimiter

_rate_limiter_enabled = False


def set_rate_limiter_enabled(enabled: bool) -> None:
    global _rate_limiter_enabled
    _rate_limiter_enabled = enabled


def get_rate_limit_dependency(times: int, seconds: int) -> Callable:
    limiter = RateLimiter(times=times, seconds=seconds)

    async def _rate_limit_dependency(request: Request, response: Response) -> None:
        if not _rate_limiter_enabled:
            return
        await limiter(request, response)

    return _rate_limit_dependency


async def rate_limit_callback(request: Request, response: Response, pexpire: int) -> None:
    retry_after_seconds = max(1, math.ceil(pexpire / 1000))
    raise HTTPException(
        status_code=429,
        detail="Too many requests. Please try again later.",
        headers={"Retry-After": str(retry_after_seconds)},
    )
