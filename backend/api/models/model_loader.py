from backend.api.dependencies.database import Base, engine


def index():
    Base.metadata.create_all(bind=engine)