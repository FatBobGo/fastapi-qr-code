import logging
import sys
from functools import lru_cache


@lru_cache()
def get_logger(name: str):
    logger = logging.getLogger(name)

    # Check if handlers are already set to avoid duplication
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        # Detailed format for production-like logging
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

    return logger
