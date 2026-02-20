""" App entry point """

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from aq_backend.config import get_settings
from aq_backend.http_errors import register_error_handlers
from aq_backend.log_config import setup_logging
from aq_backend.middleware.request_logging import RequestLoggingMiddleware
from aq_backend.middleware.timeout import RequestTimeoutMiddleware
from aq_backend.routes.air import router as air_router
from aq_backend.routes.geocode import router as geocode_router
from aq_backend.routes.health import router as health_router
from aq_backend.services.openweather import OpenWeatherService
from aq_backend.state import AppState


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

    register_error_handlers(app)

    app.include_router(health_router)
    app.include_router(geocode_router)
    app.include_router(air_router)

    return app
