import os
from dotenv import load_dotenv

load_dotenv()

class conf:
    db_host = os.getenv("DB_HOST")
    db_name = os.getenv("DB_NAME")
    db_port = os.getenv("DB_PORT")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    app_host = "0.0.0.0"
    app_port = 8000
