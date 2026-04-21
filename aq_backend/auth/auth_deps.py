""" FastAPI auth dependencies: admin key and user JWT resolution """

from __future__ import annotations

import hmac

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from aq_backend.auth.utils import decode_access_token
from aq_backend.config import get_settings
from aq_backend.db.database import get_db
from aq_backend.http_errors import api_error
from aq_backend.db.models import User

_bearer = HTTPBearer(auto_error=False)


def require_admin(x_admin_key: str | None = Header(default=None)) -> None:
    """ Reject requests that don't carry the correct admin key """
    settings = get_settings()
    if not x_admin_key or not hmac.compare_digest(x_admin_key, settings.admin_key):
        raise api_error(403, "FORBIDDEN", "Invalid or missing admin key.")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """ Resolve the authenticated user from the Bearer token """
    if not credentials:
        raise api_error(401, "MISSING_TOKEN", "Authentication required.")

    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError:
        raise api_error(401, "INVALID_TOKEN", "Invalid or expired token.")

    user_id = payload.get("sub")
    if not user_id:
        raise api_error(401, "INVALID_TOKEN", "Invalid token payload.")

    user = await db.get(User, user_id)
    if not user:
        raise api_error(401, "INVALID_TOKEN", "User not found.")

    return user
