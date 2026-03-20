from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from urllib.parse import quote_plus
from .config import conf

required_env = {
    "DB_HOST": conf.db_host,
    "DB_NAME": conf.db_name,
    "DB_PORT": conf.db_port,
    "DB_USER": conf.db_user,
    "DB_PASSWORD": conf.db_password,
}

missing = [key for key, value in required_env.items() if value in (None, "")]
if missing:
    raise RuntimeError(
        "Missing required database environment variables: " + ", ".join(missing)
    )

encoded_password = quote_plus(str(conf.db_password))

SQLALCHEMY_DATABASE_URI = (
    f"mysql+mysqlconnector://{conf.db_user}:{encoded_password}"
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