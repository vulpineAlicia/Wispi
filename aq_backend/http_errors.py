""" HTTP error mapping for the API """

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from aq_backend.services.openweather import (
    OpenWeatherNetworkError,
    OpenWeatherTimeout,
    OpenWeatherUpstreamError,
)


def error_response(
    request: Request,
    status: int,
    code: str,
    message: str,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    """ Standard API error shape """
    request_id = getattr(request.state, "request_id", None)

    return JSONResponse(
        status_code=status,
        content={
            "code": code,
            "message": message,
            "request_id": request_id,
        },
        headers=headers,
    )


def register_error_handlers(app: FastAPI) -> None:
    """ Attach exception handlers to FastAPI app """

    @app.exception_handler(OpenWeatherTimeout)
    async def ow_timeout_handler(request: Request, exc: OpenWeatherTimeout):
        if getattr(exc, "meta", None) is not None:
            request.state.upstream = exc.meta
        return error_response(request, 504, "UPSTREAM_TIMEOUT", "OpenWeather timeout")

    @app.exception_handler(OpenWeatherNetworkError)
    async def ow_network_handler(request: Request, exc: OpenWeatherNetworkError):
        if getattr(exc, "meta", None) is not None:
            request.state.upstream = exc.meta
        return error_response(request, 502, "UPSTREAM_NETWORK", "OpenWeather network error")

    @app.exception_handler(OpenWeatherUpstreamError)
    async def ow_upstream_handler(request: Request, exc: OpenWeatherUpstreamError):
        if getattr(exc, "meta", None) is not None:
            request.state.upstream = exc.meta

        if exc.status_code == 429:
            headers = {"Retry-After": exc.retry_after} if exc.retry_after else None
            return error_response(
                request,
                429,
                "RATE_LIMIT",
                "Rate limit exceeded. Try again later.",
                headers,
            )

        if exc.status_code in (401, 403):
            return error_response(request, 500, "UPSTREAM_AUTH", "Server configuration error")

        if 500 <= exc.status_code <= 599:
            return error_response(request, 502, "UPSTREAM_5XX", "Upstream service error")

        return error_response(request, 502, "UPSTREAM_ERROR", "Upstream request failed")

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return error_response(request, exc.status_code, "HTTP_ERROR", str(exc.detail))

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        meta = getattr(exc, "meta", None)
        if meta is not None:
            request.state.upstream = meta
        return error_response(request, 500, "INTERNAL_ERROR", "Unexpected server error")
