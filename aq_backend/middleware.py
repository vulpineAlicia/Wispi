""" Request logging middleware (with request_id and upstream timing) """

from __future__ import annotations

import logging
import time
import uuid
from typing import Awaitable, Callable

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
            meta = getattr(request.state, "upstream", None)

            return {
                "request_id": request_id,
                "method": request.method,
                "path": str(request.url),
                "status": status,
                "duration_ms": round(duration_ms, 2),
                "upstream_ms": "-" if meta is None else int(meta.total_ms),
                "upstream_tries": "-" if meta is None else int(meta.attempts),
                "upstream_status": "-" if meta is None else int(meta.last_status) if meta.last_status is not None else "-",
                "upstream_endpoint": "-" if meta is None else str(meta.endpoint),
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
