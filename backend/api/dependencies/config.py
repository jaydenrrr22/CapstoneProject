import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel

# Load the repo-root .env explicitly so values resolve regardless of current working directory.
ENV_PATH = Path(__file__).resolve().parents[3] / ".env"
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


def get_required_env(name: str) -> str:
    value = os.getenv(name)

    if value is None or value == "":
        env_location = ENV_PATH if ENV_PATH.exists() else "environment variables"
        raise RuntimeError(f"Missing required environment variable '{name}'. Checked {env_location}.")

    return value


class Settings(BaseModel):
    secret_key: str = get_required_env("SECRET_KEY")

config = Settings()
