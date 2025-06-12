"""Centralised logging configuration.

Adds emoji-friendly, colourised log output using *rich* when available so that
console output resembles the original reference script.
"""
from __future__ import annotations

import logging
from typing import Optional

try:
    from rich.console import Console
    from rich.logging import RichHandler
except ModuleNotFoundError:  # pragma: no cover – allow fallback without rich
    RichHandler = None  # type: ignore
    Console = None  # type: ignore


_DEF_FMT = "%(message)s"  # simple message-only format, no level/time by default


def configure_logging(level: int = logging.INFO, fmt: str | None = None) -> None:  # noqa: D401
    """Initialise root logger with pretty console formatting.

    Args:
        level: Logging level. Defaults to ``logging.INFO``.
        fmt: Optional custom format string. If *rich* is available and no format
            is given, we default to a simple message-only format so the colourful
            *rich* handler adds its own timestamp and level column. If *rich* is
            **not** available, we fall back to :pyfunc:`logging.basicConfig` with
            a more traditional format.
    """

    fmt = fmt or _DEF_FMT

    if RichHandler is not None:
        logging.basicConfig(
            level=level,
            format=fmt,
            datefmt="%H:%M:%S",
            handlers=[RichHandler(markup=True, console=Console())],
        )
    else:  # pragma: no cover
        logging.basicConfig(
            level=level,
            format=fmt or "%(levelname)s: %(message)s",
        )

    logging.getLogger(__name__).debug("Logging configured (rich=%s)", RichHandler is not None)
