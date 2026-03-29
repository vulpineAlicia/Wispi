""" FastAPI dependencies used by route handlers """

from __future__ import annotations

from fastapi import Depends, Header, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from aq_backend import auth as auth_module
from aq_backend.config import get_settings
from aq_backend.database import get_db
from aq_backend.http_errors import api_error
from aq_backend.models import User
from aq_backend.services.openweather import OpenWeatherService
from aq_backend.state import AppState

_bearer = HTTPBearer(auto_error=False)


def require_admin(x_admin_key: str | None = Header(default=None)) -> None:
    """ Reject requests that don't carry the correct admin key """
    settings = get_settings()
    if not x_admin_key or x_admin_key != settings.admin_key:
        raise api_error(403, "FORBIDDEN", "Invalid or missing admin key.")


def get_app_state(request: Request) -> AppState:
    """ Return the shared app state created during startup """
    state = getattr(request.app.state, "app_state", None)
    if state is None:
        raise RuntimeError("AppState is not initialized (startup did not run)")
    return state


def ow_service(request: Request) -> OpenWeatherService:
    """ Return the OpenWeather service from the shared app state """
    return get_app_state(request).ow


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """ Resolve the authenticated user from the Bearer token """
    if not credentials:
        raise api_error(401, "MISSING_TOKEN", "Authentication required.")

    try:
        payload = auth_module.decode_access_token(credentials.credentials)
    except ValueError:
        raise api_error(401, "INVALID_TOKEN", "Invalid or expired token.")

    user_id = payload.get("sub")
    if not user_id:
        raise api_error(401, "INVALID_TOKEN", "Invalid token payload.")

    user = await db.get(User, user_id)
    if not user:
        raise api_error(401, "INVALID_TOKEN", "User not found.")

    return user
