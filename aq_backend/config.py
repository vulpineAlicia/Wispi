""" Load and validate app config (from env variables) """

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


GEOCODE_URL = "https://api.openweathermap.org/geo/1.0/direct"
AIR_URL = "https://api.openweathermap.org/data/2.5/air_pollution"
HISTORY_URL = "https://api.openweathermap.org/data/2.5/air_pollution/history"


@dataclass(frozen=True)
class Settings:
    """ Immutable runtime config for the app """

    openweather_api_key: str
    frontend_origins: list[str]

    # HTTP client timeout (per upstream request)
    http_timeout_s: float = 6.0

    # Whole-request timeout (middleware budget)
    request_timeout_s: float = 12.0

    # OpenWeather retry policy
    ow_total_budget_s: float = 6.0
    ow_max_attempts: int = 3

    geocode_url: str = GEOCODE_URL
    air_url: str = AIR_URL
    history_url: str = HISTORY_URL


def _parse_float_env(name: str, default: float) -> float:
    """ Read a float from env or return the default if invalid """
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    try:
        return float(raw)
    except ValueError:
        return default


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """ Load and validate configuration once and cache it for the app lifetime """

    api_key = os.getenv("OPENWEATHER_API_KEY", "").strip()

    if not api_key:
        raise RuntimeError("OPENWEATHER_API_KEY is required (set it in .env/.env.example)")
    app_env = os.getenv("APP_ENV", "development").strip().lower()

    origins_raw = os.getenv("FRONTEND_ORIGINS", "").strip()
    origins = [o.strip() for o in origins_raw.split(",") if o.strip()]
    origins = [o.rstrip("/") for o in origins]

    if not origins:
        if app_env in {"dev", "development", "local"}:
            origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
        else:
            raise RuntimeError(
                "FRONTEND_ORIGINS is required in non-development env "
                "(comma separated, e.g. https://your-frontend.com)"
            )

    if "*" in origins:
        raise RuntimeError(
            "FRONTEND_ORIGINS cannot contain '*' (CORS wildcard) because allow_credentials=True"
        )

    http_timeout_s = _parse_float_env("HTTP_TIMEOUT_S", 6.0)
    request_timeout_s = _parse_float_env("REQUEST_TIMEOUT_S", 12.0)
    ow_total_budget_s = _parse_float_env("OW_TOTAL_BUDGET_S", 6.0)
    try:
        ow_max_attempts = int(os.getenv("OW_MAX_ATTEMPTS", "3"))
    except ValueError as exc:
        raise RuntimeError("OW_MAX_ATTEMPTS must be an integer") from exc

    if request_timeout_s <= 0:
        raise RuntimeError("REQUEST_TIMEOUT_S must be > 0")
    if http_timeout_s <= 0:
        raise RuntimeError("HTTP_TIMEOUT_S must be > 0")
    if ow_total_budget_s <= 0:
        raise RuntimeError("OW_TOTAL_BUDGET_S must be > 0")
    if ow_max_attempts < 1:
        raise RuntimeError("OW_MAX_ATTEMPTS must be >= 1")

    return Settings(
        openweather_api_key=api_key,
        frontend_origins=origins,
        http_timeout_s=http_timeout_s,
        request_timeout_s=request_timeout_s,
        ow_total_budget_s=ow_total_budget_s,
        ow_max_attempts=ow_max_attempts,
    )
