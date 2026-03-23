""" Rate limiting setup """

from __future__ import annotations

from fastapi import Request
from slowapi import Limiter

# Limits per endpoint (per IP, per minute)
GEOCODE_LIMIT = "30/minute"
AIR_CURRENT_LIMIT = "60/minute"
AIR_HISTORY_LIMIT = "30/minute"
# Tiles are fetched in batches during map panning — allow higher burst
TILE_LIMIT = "120/minute"


def _get_client_ip(request: Request) -> str:
    """ Return the real client IP, reading X-Forwarded-For set by Caddy """
    xff = request.headers.get("x-forwarded-for")
    if xff:
        ips = [ip.strip() for ip in xff.split(",")]
        return ips[-1]
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=_get_client_ip)
