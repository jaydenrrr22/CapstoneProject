from backend.api.dependencies.database import Base, engine


def index():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)