""" Request logging middleware (with request_id and upstream timing) """

from __future__ import annotations

import logging
import re
import time
import uuid
from typing import Awaitable, Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

_REQUEST_ID_RE = re.compile(r"^[a-zA-Z0-9\-_]{1,64}$")

logger = logging.getLogger("aq_backend.http")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """ Log warnings on 4xx, errors on 5xx, and unhandled exceptions """

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        raw_id = request.headers.get("x-request-id", "")
        request_id = raw_id if _REQUEST_ID_RE.match(raw_id) else uuid.uuid4().hex
        request.state.request_id = request_id

        start = time.perf_counter()

        def build_extra(status: int) -> dict[str, object]:
            duration_ms = (time.perf_counter() - start) * 1000.0
            meta = getattr(request.state, "upstream", None)

            return {
                "request_id": request_id,
                "method": request.method,
                "path": str(request.url),
                "status": status,
                "duration_ms": round(duration_ms, 2),
                "upstream_ms": "-" if meta is None else int(meta.total_ms),
                "upstream_tries": "-" if meta is None else int(meta.attempts),
                "upstream_status": "-" if meta is None or meta.last_status is None else int(meta.last_status),
                "upstream_endpoint": "-" if meta is None else str(meta.endpoint),
            }

        try:
            response = await call_next(request)
        except Exception:
            logger.exception("Unhandled exception", extra=build_extra(500))
            raise

        status = response.status_code
        if status >= 500:
            logger.error("Request failed", extra=build_extra(status))
        elif status >= 400:
            logger.warning("Request failed", extra=build_extra(status))

        response.headers["x-request-id"] = request_id
        return response
