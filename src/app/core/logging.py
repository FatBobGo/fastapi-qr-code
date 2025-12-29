import logging
import sys
from functools import lru_cache
from logging.handlers import RotatingFileHandler
import os

# Create a logs directory if it doesn't exist
log_dir = "logs"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

log_file = os.path.join(log_dir, "qr_app.log")


@lru_cache()
def get_logger(name: str):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Check if handlers are already set to avoid duplication
    if not logger.handlers:
        # Stream handler for console output
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        stream_handler.setFormatter(stream_formatter)
        logger.addHandler(stream_handler)

        # Rotating file handler for file output
        file_handler = RotatingFileHandler(
            log_file, maxBytes=1024 * 1024 * 5, backupCount=5  # 5 MB
        )
        file_formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

    return logger
