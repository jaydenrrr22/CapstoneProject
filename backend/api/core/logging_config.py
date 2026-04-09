import logging
import json
from datetime import datetime


class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
        }

        # Add optional structured fields
        if hasattr(record, "user_id"):
            log_record["user_id"] = record.user_id

        if hasattr(record, "endpoint"):
            log_record["endpoint"] = record.endpoint

        if hasattr(record, "latency"):
            log_record["latency_ms"] = record.latency

        if hasattr(record, "ip"):
            log_record["ip_address"] = record.ip

        return json.dumps(log_record)


def setup_logging():
    formatter = JSONFormatter()

    # App log
    app_handler = logging.FileHandler("/home/ubuntu/app.log")
    app_handler.setFormatter(formatter)

    # Security log
    security_handler = logging.FileHandler("/home/ubuntu/security.log")
    security_handler.setFormatter(formatter)

    app_logger = logging.getLogger("app")
    app_logger.setLevel(logging.INFO)
    app_logger.addHandler(app_handler)

    security_logger = logging.getLogger("security")
    security_logger.setLevel(logging.WARNING)
    security_logger.addHandler(security_handler)

    return app_logger, security_logger
