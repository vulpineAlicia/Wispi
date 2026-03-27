""" Load and validate app config (from env variables) """

from __future__ import annotations

from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

GEOCODE_URL = "https://api.openweathermap.org/geo/1.0/direct"
AIR_URL = "https://api.openweathermap.org/data/2.5/air_pollution"
HISTORY_URL = "https://api.openweathermap.org/data/2.5/air_pollution/history"

_DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]


class Settings(BaseSettings):
    """ Immutable runtime config for the app """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        enable_decoding=False,
    )

    openweather_api_key: str = Field(..., alias="OPENWEATHER_API_KEY")
    app_env: str = Field("development", alias="APP_ENV")
    frontend_origins: list[str] = Field(default_factory=list, alias="FRONTEND_ORIGINS")

    # Database
    database_url: str = Field(..., alias="DATABASE_URL")

    # Auth / JWT
    jwt_secret: str = Field(..., alias="JWT_SECRET")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(30, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    # HTTP client timeout (per upstream request)
    http_timeout_s: float = Field(6.0, alias="HTTP_TIMEOUT_S")

    # Whole-request timeout (middleware budget)
    request_timeout_s: float = Field(12.0, alias="REQUEST_TIMEOUT_S")

    # OpenWeather retry policy
    ow_total_budget_s: float = Field(6.0, alias="OW_TOTAL_BUDGET_S")
    ow_max_attempts: int = Field(3, alias="OW_MAX_ATTEMPTS")

    geocode_url: str = GEOCODE_URL
    air_url: str = AIR_URL
    history_url: str = HISTORY_URL

    @field_validator("jwt_secret")
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        """ Ensure JWT secret is set and long enough """
        value = value.strip()
        if len(value) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        return value

    @field_validator("openweather_api_key")
    @classmethod
    def validate_api_key(cls, value: str) -> str:
        """ Ensure OpenWeather API key is provided and not empty """
        value = value.strip()
        if not value:
            raise ValueError("OPENWEATHER_API_KEY is required")
        return value

    @field_validator("app_env")
    @classmethod
    def normalize_app_env(cls, value: str) -> str:
        """ Normalize environment name: strip whitespace and convert to lowercase """
        return value.strip().lower()

    @field_validator("frontend_origins", mode="before")
    @classmethod
    def parse_frontend_origins(cls, value: Any) -> list[str]:
        """
        Normalize FRONTEND_ORIGINS into a list of cleaned URLs

        Accepts comma-separated string or list of strings;

        Trims whitespace, removes trailing slashes, filters out empty values

        """
        if value is None:
            return []

        if isinstance(value, str):
            value = value.strip()
            if not value:
                return []
            return [item.strip().rstrip("/") for item in value.split(",") if item.strip()]

        if isinstance(value, list):
            result: list[str] = []
            for item in value:
                if isinstance(item, str):
                    cleaned = item.strip().rstrip("/")
                    if cleaned:
                        result.append(cleaned)
            return result

        raise ValueError("FRONTEND_ORIGINS must be a comma-separated string or a list of strings")

    @field_validator("http_timeout_s", "request_timeout_s", "ow_total_budget_s")
    @classmethod
    def validate_positive_float(cls, value: float) -> float:
        """ Ensure timeout values are positive """
        if value <= 0:
            raise ValueError("timeout values must be > 0")
        return value

    @field_validator("ow_max_attempts")
    @classmethod
    def validate_attempts(cls, value: int) -> int:
        """ Ensure retry attempts count is at least 1 """
        if value < 1:
            raise ValueError("OW_MAX_ATTEMPTS must be >= 1")
        return value

    @model_validator(mode="after")
    def validate_cross_field_rules(self) -> Settings:
        """ Ensure frontend origins are valid and request timeout exceeds upstream budget """
        if not self.frontend_origins:
            if self.app_env in {"dev", "development", "local"}:
                self.frontend_origins = list(_DEV_ORIGINS)
            else:
                raise ValueError(
                    "FRONTEND_ORIGINS is required in non-development env "
                    "(comma separated, e.g. https://your-frontend.com)"
                )

        if "*" in self.frontend_origins:
            raise ValueError(
                "FRONTEND_ORIGINS cannot contain '*' because allow_credentials=True"
            )

        if self.request_timeout_s <= self.ow_total_budget_s:
            raise ValueError(
                "REQUEST_TIMEOUT_S should be greater than OW_TOTAL_BUDGET_S "
                "so upstream retry handling can finish first"
            )

        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """ Load configuration once and cache it for the app lifetime """
    return Settings()
