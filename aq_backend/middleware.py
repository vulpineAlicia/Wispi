""" Request logging middleware (with request_id and upstream timing) """

from __future__ import annotations

import logging
import time
import uuid
from typing import Callable, Awaitable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger("aq_backend.http")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """ Logging only for server-side failures (5xx) and unhandled exceptions """

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        request.state.request_id = request_id

        start = time.perf_counter()

        def build_extra(status: int) -> dict[str, object]:
            duration_ms = (time.perf_counter() - start) * 1000.0

            upstream_ms = getattr(request.state, "upstream_ms", None)
            upstream_tries = getattr(request.state, "upstream_tries", None)
            upstream_status = getattr(request.state, "upstream_status", None)
            upstream_endpoint = getattr(request.state, "upstream_endpoint", None)

            return {
                "request_id": request_id,
                "method": request.method,
                "path": str(request.url),
                "status": status,
                "duration_ms": round(duration_ms, 2),
                "upstream_ms": "-" if upstream_ms is None else round(float(upstream_ms), 2),
                "upstream_tries": "-" if upstream_tries is None else int(upstream_tries),
                "upstream_status": "-" if upstream_status is None else int(upstream_status),
                "upstream_endpoint": "-" if upstream_endpoint is None else str(upstream_endpoint),
            }

        try:
            response = await call_next(request)
        except Exception:
            logger.exception("Unhandled exception", extra=build_extra(500))
            raise

        if response.status_code >= 500:
            logger.error("Request failed", extra=build_extra(response.status_code))

        response.headers["x-request-id"] = request_id
        return response
