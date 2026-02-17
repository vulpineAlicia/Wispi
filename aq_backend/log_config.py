"""
    App logging config
    Provides colored structured logs for aq_backend
    
"""

from __future__ import annotations

import logging
import os
import sys

from colorlog import ColoredFormatter


_DEFAULT_EXTRAS = {
    "request_id": "-",
    "method": "-",
    "path": "-",
    "status": "-",
    "duration_ms": "-",
    "upstream_ms": "-",
    "upstream_tries": "-",
    "upstream_status": "-",
    "upstream_endpoint": "-",
}


class _DefaultExtrasFilter(logging.Filter):
    """ Ensures all structured log fields exist """

    def filter(self, record: logging.LogRecord) -> bool:
        for key, value in _DEFAULT_EXTRAS.items():
            if not hasattr(record, key):
                setattr(record, key, value)
        return True


def setup_logging() -> None:
    """ Configure colored logging for aq_backend logger """
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    logger = logging.getLogger("aq_backend")
    logger.setLevel(level)
    logger.propagate = False

    if any(getattr(h, "name", None) == "aq_backend_handler" for h in logger.handlers):
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.name = "aq_backend_handler"
    handler.setLevel(level)
    handler.addFilter(_DefaultExtrasFilter())

    formatter = ColoredFormatter(
        "%(log_color)s%(levelname)s%(reset)s     "
        "%(name)s "
        "\x1b[1mr_id=%(request_id)s\x1b[0m "
        "%(method)s %(path)s %(status)s "
        "\x1b[1mdur=%(duration_ms)sms\x1b[0m "
        "\x1b[1mup=%(upstream_ms)sms\x1b[0m "
        "tries=%(upstream_tries)s "
        "ow=%(upstream_status)s "
        "ep=%(upstream_endpoint)s",
        log_colors={
            "DEBUG": "white",
            "INFO": "green",
            "WARNING": "yellow",
            "ERROR": "red",
            "CRITICAL": "bold_red",
        },
        reset=True,
    )

    handler.setFormatter(formatter)
    logger.addHandler(handler)
