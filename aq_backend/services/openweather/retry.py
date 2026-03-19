""" Utilities for retry logic, including backoff and Retry-After parsing """

from __future__ import annotations

import random
import time
from email.utils import parsedate_to_datetime


def compute_backoff_s(
    attempt: int,
    *,
    base: float = 0.3,
    cap: float = 5.0,
) -> float:
    """ Compute backoff delay before retrying the request """
    delay = min(cap, base * (2 ** (attempt - 1)))
    return delay * random.uniform(0.8, 1.2)


def parse_retry_after_s(value: str) -> float | None:
    """ Parse Retry-After header into seconds; supports seconds or HTTP date """
    value = value.strip()
    if not value:
        return None

    try:
        seconds = float(value)
        if seconds < 0:
            return None
        return seconds
    except ValueError:
        pass

    try:
        dt = parsedate_to_datetime(value)
        return max(0.0, dt.timestamp() - time.time())
    except (TypeError, ValueError, OSError):
        return None


def is_retryable_status(status_code: int) -> bool:
    """ Return True if status code should trigger a retry """
    return status_code == 429 or 500 <= status_code <= 599
