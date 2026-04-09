import logging
import os

logger = logging.getLogger("security")
logger.setLevel(logging.INFO)

handler = logging.FileHandler(os.path.join(os.getcwd(), "security.log"))
formatter = logging.Formatter(
    '{"timestamp":"%(asctime)s","event":"%(message)s"}'
)

handler.setFormatter(formatter)
logger.addHandler(handler)


def log_security_event(event_type, details):
    logger.info(f"{event_type} | {details}")
