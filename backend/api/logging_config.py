import logging
import json
import os
from datetime import datetime


class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
        }

        # Include ALL extra fields automatically
        for key, value in record.__dict__.items():
            if key not in (
                "name", "msg", "args", "levelname", "levelno",
                "pathname", "filename", "module", "exc_info",
                "exc_text", "stack_info", "lineno", "funcName",
                "created", "msecs", "relativeCreated", "thread",
                "threadName", "processName", "process"
            ):
                log_record[key] = value

        return json.dumps(log_record)

def setup_logging():
    formatter = JSONFormatter()

    # Centralise log directory: honour LOG_DIR env var, fall back to CWD.
    # On EC2 the systemd unit sets LOG_DIR=/home/ubuntu to preserve the
    # original log locations (/home/ubuntu/app.log, /home/ubuntu/security.log).
    log_dir = os.environ.get("LOG_DIR", os.getcwd())
    os.makedirs(log_dir, mode=0o750, exist_ok=True)

    # File handlers – both paths derived from the same log_dir
    app_handler = logging.FileHandler(os.path.join(log_dir, "app.log"))
    app_handler.setFormatter(formatter)

    security_handler = logging.FileHandler(os.path.join(log_dir, "security.log"))
    security_handler.setFormatter(formatter)

    # App logger
    app_logger = logging.getLogger("app")
    app_logger.setLevel(logging.INFO)
    app_logger.handlers = []  # prevent duplicate logs
    app_logger.addHandler(app_handler)

    # Security logger
    security_logger = logging.getLogger("security")
    security_logger.setLevel(logging.WARNING)
    security_logger.handlers = []
    security_logger.addHandler(security_handler)

    return app_logger, security_logger
