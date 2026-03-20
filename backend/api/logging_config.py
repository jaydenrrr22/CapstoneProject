import logging
import json
import os
from datetime import datetime


class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
        }

        if hasattr(record, "request_id"):
            log_record["request_id"] = record.request_id

        return json.dumps(log_record)


def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    if os.name == "nt":
        log_path = "trace-backend.log"
    else:
        log_path = "/home/ubuntu/trace-backend.log"

    file_handler = logging.FileHandler(log_path)

    formatter = JsonFormatter()
    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)