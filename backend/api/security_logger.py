import logging

# Rely on setup_logging() (called in main.py) for handler and level configuration.
# The "security" logger is set to WARNING there, so events are emitted at that level.
logger = logging.getLogger("security")


def log_security_event(event_type, details):
    logger.warning(f"{event_type} | {details}")
