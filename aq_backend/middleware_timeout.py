""" 
    Request timeout middleware
    Stops requests that take longer than the configured timeout and returns HTTP 504 
"""

from __future__ import annotations

import asyncio
from typing import Callable, Awaitable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response


class RequestTimeoutMiddleware(BaseHTTPMiddleware):
    """ Enforce a time limit for the whole request """

    def __init__(self, app, timeout_s: float) -> None:
        super().__init__(app)
        self._timeout_s = float(timeout_s)

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        try:
            return await asyncio.wait_for(call_next(request), timeout=self._timeout_s)
        except asyncio.TimeoutError:
            request_id = getattr(request.state, "request_id", None)
            return JSONResponse(
                status_code=504,
                content={
                    "code": "REQUEST_TIMEOUT",
                    "message": "Request timed out",
                    "request_id": request_id,
                },
            )
