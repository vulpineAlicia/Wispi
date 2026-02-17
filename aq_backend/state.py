""" Shared objects created at startup """

from __future__ import annotations

from dataclasses import dataclass

import httpx

from aq_backend.services.openweather import OpenWeatherService


@dataclass
class AppState:
    """ Holds shared services for the lifetime of the app """

    http: httpx.AsyncClient
    ow: OpenWeatherService
