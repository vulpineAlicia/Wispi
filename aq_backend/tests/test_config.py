import pytest
from pydantic import ValidationError

from aq_backend.config import Settings

_BASE = dict(
    OPENWEATHER_API_KEY="test-key",
    DATABASE_URL="sqlite+aiosqlite:///:memory:",
    ADMIN_KEY="a" * 32,
    JWT_SECRET="s" * 32,
    APP_ENV="development",
    FRONTEND_ORIGINS="http://localhost:5173",
)


def _make(**overrides) -> Settings:
    return Settings(**{**_BASE, **overrides})


def test_admin_key_too_short_raises():
    with pytest.raises(ValidationError, match="ADMIN_KEY"):
        _make(ADMIN_KEY="tooshort")


def test_jwt_secret_too_short_raises():
    with pytest.raises(ValidationError, match="JWT_SECRET"):
        _make(JWT_SECRET="tooshort")


def test_admin_key_exactly_32_chars_is_valid():
    s = _make(ADMIN_KEY="a" * 32)
    assert len(s.admin_key) == 32


def test_admin_key_strips_whitespace():
    s = _make(ADMIN_KEY=" " + "a" * 32)
    assert s.admin_key == "a" * 32


def test_wildcard_origin_raises():
    with pytest.raises(ValidationError):
        _make(APP_ENV="production", FRONTEND_ORIGINS="*")


def test_production_requires_explicit_origins():
    with pytest.raises(ValidationError, match="FRONTEND_ORIGINS"):
        _make(APP_ENV="production", FRONTEND_ORIGINS="")


def test_dev_env_gets_localhost_defaults_when_origins_empty():
    s = _make(FRONTEND_ORIGINS="")
    assert "http://localhost:5173" in s.frontend_origins


def test_parse_origins_strips_trailing_slash():
    s = _make(FRONTEND_ORIGINS="https://myapp.com/")
    assert "https://myapp.com" in s.frontend_origins
    assert "https://myapp.com/" not in s.frontend_origins


def test_parse_origins_comma_separated():
    s = _make(FRONTEND_ORIGINS="https://a.com, https://b.com")
    assert s.frontend_origins == ["https://a.com", "https://b.com"]


def test_parse_origins_filters_empty_segments():
    s = _make(FRONTEND_ORIGINS="https://a.com,,https://b.com")
    assert len(s.frontend_origins) == 2


def test_request_timeout_must_exceed_ow_budget():
    with pytest.raises(ValidationError, match="REQUEST_TIMEOUT_S"):
        _make(REQUEST_TIMEOUT_S=5.0, OW_TOTAL_BUDGET_S=6.0)


def test_valid_timeouts_pass():
    s = _make(REQUEST_TIMEOUT_S=15.0, OW_TOTAL_BUDGET_S=6.0)
    assert s.request_timeout_s == 15.0


def test_negative_http_timeout_raises():
    with pytest.raises(ValidationError):
        _make(HTTP_TIMEOUT_S=-1.0)


def test_zero_request_timeout_raises():
    with pytest.raises(ValidationError):
        _make(REQUEST_TIMEOUT_S=0.0)


def test_empty_api_key_raises():
    with pytest.raises(ValidationError):
        _make(OPENWEATHER_API_KEY="")


def test_api_key_strips_whitespace():
    s = _make(OPENWEATHER_API_KEY="  mykey  ")
    assert s.openweather_api_key == "mykey"


def test_ow_max_attempts_zero_raises():
    with pytest.raises(ValidationError):
        _make(OW_MAX_ATTEMPTS=0)


def test_ow_max_attempts_one_is_valid():
    s = _make(OW_MAX_ATTEMPTS=1)
    assert s.ow_max_attempts == 1
