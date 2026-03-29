""" HTTP error mapping for the API """

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from aq_backend.services.openweather import (
    OpenWeatherNetworkError,
    OpenWeatherTimeout,
    OpenWeatherUpstreamError,
)


def api_error(status_code: int, code: str, message: str) -> HTTPException:
    """ Create an HTTPException that will be normalized by the global handler """
    return HTTPException(
        status_code=status_code,
        detail={
            "code": code,
            "message": message,
        },
    )


def error_response(
    request: Request,
    status: int,
    code: str,
    message: str,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    """ Return the standard API error response shape """
    request_id = getattr(request.state, "request_id", None)

    merged_headers: dict[str, str] = {}
    if headers:
        merged_headers.update(headers)
    if request_id:
        merged_headers.setdefault("X-Request-Id", str(request_id))

    return JSONResponse(
        status_code=status,
        content={
            "code": code,
            "message": message,
            "request_id": request_id,
        },
        headers=merged_headers or None,
    )


def _http_code_from_status(status_code: int) -> str:
    """ Fallback error code mapping for generic HTTP exceptions """
    if status_code in (400, 422):
        return "INVALID_QUERY"
    if status_code == 401:
        return "UNAUTHORIZED"
    if status_code == 403:
        return "FORBIDDEN"
    if status_code == 404:
        return "NOT_FOUND"
    if status_code == 429:
        return "RATE_LIMIT"
    if 500 <= status_code <= 599:
        return "INTERNAL_ERROR"
    return f"HTTP_{status_code}"


def _extract_code_message_from_detail(detail: Any) -> tuple[str | None, str | None]:
    """ Extract normalized code or message if present """
    if not isinstance(detail, dict):
        return None, None

    code = detail.get("code")
    message = detail.get("message")

    return (
        code if isinstance(code, str) else None,
        message if isinstance(message, str) else None,
    )


def _attach_meta(request: Request, exc: BaseException) -> None:
    meta = getattr(exc, "meta", None)
    if meta is not None:
        request.state.upstream = meta


def register_error_handlers(app: FastAPI) -> None:
    """ Attach exception handlers to the FastAPI app """

    @app.exception_handler(OpenWeatherTimeout)
    async def ow_timeout_handler(request: Request, exc: OpenWeatherTimeout):
        _attach_meta(request, exc)
        return error_response(
            request,
            504,
            "UPSTREAM_TIMEOUT",
            "OpenWeather timeout.",
        )

    @app.exception_handler(OpenWeatherNetworkError)
    async def ow_network_handler(request: Request, exc: OpenWeatherNetworkError):
        _attach_meta(request, exc)
        return error_response(
            request,
            502,
            "UPSTREAM_NETWORK",
            "OpenWeather network error.",
        )

    @app.exception_handler(OpenWeatherUpstreamError)
    async def ow_upstream_handler(request: Request, exc: OpenWeatherUpstreamError):
        _attach_meta(request, exc)

        if exc.status_code == 429:
            headers = {"Retry-After": exc.retry_after} if exc.retry_after else None
            return error_response(
                request,
                429,
                "UPSTREAM_RATE_LIMIT",
                "Rate limit exceeded. Try again later.",
                headers,
            )

        if exc.status_code in (401, 403):
            return error_response(
                request,
                500,
                "UPSTREAM_AUTH",
                "Server configuration error.",
            )

        if 500 <= exc.status_code <= 599:
            return error_response(
                request,
                502,
                "UPSTREAM_5XX",
                "Upstream service error.",
            )

        return error_response(
            request,
            502,
            "UPSTREAM_ERROR",
            "Upstream request failed.",
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        code, message = _extract_code_message_from_detail(exc.detail)

        if code is None:
            code = _http_code_from_status(exc.status_code)

        if message is None:
            message = exc.detail if isinstance(exc.detail, str) else "Request failed."

        return error_response(request, exc.status_code, code, message)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        _attach_meta(request, exc)

        return error_response(
            request,
            500,
            "INTERNAL_ERROR",
            "Unexpected server error.",
        )
