from . import user

def load_routes(app):
    app.include_router(user.router)
