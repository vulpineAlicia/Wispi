""" FastAPI dependencies for service and infrastructure access """

from __future__ import annotations

from dataclasses import dataclass

import httpx
from fastapi import Request

from aq_backend.services.openweather import OpenWeatherService


@dataclass
class AppState:
    """ Holds shared services for the lifetime of the app """

    http: httpx.AsyncClient
    ow: OpenWeatherService


def get_app_state(request: Request) -> AppState:
    """ Return the shared app state created during startup """
    state = getattr(request.app.state, "app_state", None)
    if state is None:
        raise RuntimeError("AppState is not initialized (startup did not run)")
    return state


def ow_service(request: Request) -> OpenWeatherService:
    """ Return the OpenWeather service from the shared app state """
    return get_app_state(request).ow
