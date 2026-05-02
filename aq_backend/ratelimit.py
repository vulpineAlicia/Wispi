""" Rate limiting setup """

from __future__ import annotations

from fastapi import Request
from slowapi import Limiter

from aq_backend.config import get_settings

# Limits per endpoint (per IP, per minute)
GEOCODE_LIMIT = "30/minute"
AIR_CURRENT_LIMIT = "60/minute"
AIR_HISTORY_LIMIT = "30/minute"
# Tiles fetched in batches
TILE_LIMIT = "120/minute"
# Auth endpoints limit
AUTH_LIMIT = "10/minute"
# Admin endpoints limit
ADMIN_LIMIT = "20/minute"
# Favorites mutations limit
FAVORITES_LIMIT = "30/minute"


def _get_client_ip(request: Request) -> str:
    """ Return the real client IP; only trust X-Forwarded-For from configured trusted proxies """
    direct_ip = request.client.host if request.client else None
    trusted = get_settings().trusted_proxies
    if trusted and direct_ip in trusted:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            return xff.split(",")[-1].strip()
    return direct_ip or request.headers.get("x-real-ip", "unknown")


limiter = Limiter(key_func=_get_client_ip)
