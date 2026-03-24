from . import user, transaction, subscription, budget, simulation, analytics, insight


def load_routes(app):
    app.include_router(user.router)
    app.include_router(transaction.router)
    app.include_router(subscription.router)
    app.include_router(budget.router)
    app.include_router(simulation.router)
    app.include_router(analytics.router)
    app.include_router(insight.router)