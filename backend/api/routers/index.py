from . import user, transaction

def load_routes(app):
    app.include_router(user.router)
    app.include_router(transaction.router)