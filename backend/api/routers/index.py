from . import user, transaction, subscription, budget, simulation, analytics
from fastapi import Depends
from backend.api.dependencies.rate_limit import get_rate_limit_dependency


def load_routes(app):
    app.include_router(user.router)
    app.include_router(
        transaction.router,
        dependencies=[Depends(get_rate_limit_dependency(times=60, seconds=60))],
    )
    app.include_router(
        subscription.router,
        dependencies=[Depends(get_rate_limit_dependency(times=60, seconds=60))],
    )
    app.include_router(
        budget.router,
        dependencies=[Depends(get_rate_limit_dependency(times=60, seconds=60))],
    )
    app.include_router(
        simulation.router,
        dependencies=[Depends(get_rate_limit_dependency(times=60, seconds=60))],
    )
    app.include_router(
        analytics.router,
        dependencies=[Depends(get_rate_limit_dependency(times=60, seconds=60))],
    )