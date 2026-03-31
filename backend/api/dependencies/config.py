import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel

# Load backend/.env explicitly so values resolve regardless of current working directory.
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

class conf:
    db_host = os.getenv("DB_HOST")
    db_name = os.getenv("DB_NAME")
    db_port = os.getenv("DB_PORT", "3306")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    app_host = "0.0.0.0"
    app_port = 8000

class Settings(BaseModel):
    secret_key: str = os.environ["SECRET_KEY"]

config = Settings()