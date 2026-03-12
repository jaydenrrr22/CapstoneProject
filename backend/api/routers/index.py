from . import user, transaction, subscription, budget, simulation


def load_routes(app):
    app.include_router(user.router)
    app.include_router(transaction.router)
    app.include_router(subscription.router)
    app.include_router(budget.router)
    app.include_router(simulation.router)