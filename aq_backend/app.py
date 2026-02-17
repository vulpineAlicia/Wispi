""" App entry point """

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from aq_backend.config import get_settings
from aq_backend.log_config import setup_logging
from aq_backend.middleware import RequestLoggingMiddleware
from aq_backend.middleware_timeout import RequestTimeoutMiddleware

from aq_backend.routes.air import router as air_router
from aq_backend.routes.geocode import router as geocode_router
from aq_backend.routes.health import router as health_router

from aq_backend.services.openweather import (
    OpenWeatherNetworkError,
    OpenWeatherService,
    OpenWeatherTimeout,
    OpenWeatherUpstreamError,
)

from aq_backend.state import AppState


def error_response(
    request: Request,
    status: int,
    code: str,
    message: str,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    """ Return a standardized error JSON used by all API error handlers """
    request_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=status,
        content={"code": code, "message": message, "request_id": request_id},
        headers=headers,
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    App lifespan handler

    On startup: creates shared HTTP client and OpenWeather service (stores them in app state);
    On shutdown: closes the HTTP client.
    """
    settings = get_settings()

    async with httpx.AsyncClient(timeout=httpx.Timeout(settings.http_timeout_s)) as client:
        ow = OpenWeatherService(
            client=client,
            api_key=settings.openweather_api_key,
            geocode_url=settings.geocode_url,
            air_url=settings.air_url,
            history_url=settings.history_url,
            total_budget_s=settings.ow_total_budget_s,
            max_attempts=settings.ow_max_attempts,
        )
        app.state.app_state = AppState(http=client, ow=ow)
        yield


def create_app() -> FastAPI:
    """
    Application factory
    
    Creates and configures the FastAPI app (logging, middleware, error handling, routes)
    """
    setup_logging()
    settings = get_settings()

    app = FastAPI(title="AQ Backend", version="0.0.1", lifespan=lifespan)

    app.add_middleware(RequestTimeoutMiddleware, timeout_s=settings.request_timeout_s)
    app.add_middleware(RequestLoggingMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.frontend_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(OpenWeatherTimeout)
    async def ow_timeout_handler(request: Request, _exc: OpenWeatherTimeout) -> JSONResponse:
        return error_response(request, 504, "UPSTREAM_TIMEOUT", "OpenWeather timeout")

    @app.exception_handler(OpenWeatherNetworkError)
    async def ow_network_handler(request: Request, _exc: OpenWeatherNetworkError) -> JSONResponse:
        return error_response(request, 502, "UPSTREAM_NETWORK", "OpenWeather network error")

    @app.exception_handler(OpenWeatherUpstreamError)
    async def ow_upstream_handler(request: Request, exc: OpenWeatherUpstreamError) -> JSONResponse:

        if exc.status_code == 429:
            headers = {"Retry-After": exc.retry_after} if exc.retry_after else None
            return error_response(request, 429, "RATE_LIMIT", "Rate limit exceeded. Try again later.", headers)

        if exc.status_code in (401, 403):
            return error_response(request, 500, "UPSTREAM_AUTH", "Server configuration error")

        if 500 <= exc.status_code <= 599:
            return error_response(request, 502, "UPSTREAM_5XX", "Upstream service error")
        
        return error_response(request, 502, "UPSTREAM_ERROR", "Upstream request failed")

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return error_response(request, exc.status_code, "HTTP_ERROR", str(exc.detail))

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, _exc: Exception) -> JSONResponse:
        return error_response(request, 500, "INTERNAL_ERROR", "Unexpected server error")

    app.include_router(health_router)
    app.include_router(geocode_router)
    app.include_router(air_router)

    return app
