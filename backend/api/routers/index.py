from . import user, transaction, subscription, budget, simulation, analytics, insight, summary, prediction
from fastapi import Depends
from backend.api.dependencies.rate_limit import get_rate_limit_dependency


def load_routes(app):
    app.include_router(user.router)

    # Apply rate limiting to general protected routes
    rate_limit = Depends(get_rate_limit_dependency(times=60, seconds=60))

    app.include_router(transaction.router, dependencies=[rate_limit])
    app.include_router(subscription.router, dependencies=[rate_limit])
    app.include_router(budget.router, dependencies=[rate_limit])
    app.include_router(simulation.router, dependencies=[rate_limit])
    app.include_router(analytics.router, dependencies=[rate_limit])
    app.include_router(insight.router, dependencies=[rate_limit])
    app.include_router(summary.router, dependencies=[rate_limit])
    app.include_router(prediction.router, dependencies=[rate_limit])