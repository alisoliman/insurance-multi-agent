import logging
import sys
from typing import Any, Dict, Optional

from .config import settings

# Configure logging
log_format = "%(asctime)s - %(levelname)s - %(message)s"


def setup_logging() -> None:
    """Configure logging for the application."""
    log_level = getattr(logging, settings.LOG_LEVEL)
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    
    # Set log levels for other libraries
    logging.getLogger("uvicorn").setLevel(log_level)
    logging.getLogger("uvicorn.access").setLevel(log_level)
    logging.getLogger("fastapi").setLevel(log_level)


# Create a logger instance
logger = logging.getLogger("app")


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Get a logger instance with the given name."""
    return logging.getLogger(name or "app")
