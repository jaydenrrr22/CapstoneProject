from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from urllib.parse import quote_plus
from .config import conf

SQLALCHEMY_DATABASE_URI = (
    f"mysql+mysqlconnector://{conf.db_user}:{conf.db_password}"
    f"@{conf.db_host}:{conf.db_port}/{conf.db_name}"
    )

engine = create_engine(SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()