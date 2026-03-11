""" Tile proxy route """

from __future__ import annotations

from typing import Literal

import httpx
from fastapi import APIRouter, Request, Response

from aq_backend.http_errors import api_error

router = APIRouter(prefix="/tiles", tags=["tiles"])

Layer = Literal[
    "temp_new",
    "precipitation_new",
    "clouds_new",
    "pressure_new",
    "wind_new",
]

_MAX_Z = 20
_CACHE_SECONDS = 3600


@router.get("/ow/{layer}/{z}/{x}/{y}.png")
async def openweather_tile(
    request: Request,
    layer: Layer,
    z: int,
    x: int,
    y: int,
) -> Response:
    """
    Proxy OpenWeather tile overlays

    Returns PNG bytes and cache headers
    """

    if z < 0 or z > _MAX_Z:
        raise api_error(400, "INVALID_QUERY", "Invalid zoom level.")

    if x < 0 or y < 0:
        raise api_error(400, "INVALID_QUERY", "Invalid tile coordinates.")

    settings = request.app.state.settings
    api_key = getattr(settings, "openweather_api_key", None)

    if not api_key:
        raise api_error(
            500,
            "SERVER_MISCONFIGURED",
            "OPENWEATHER_API_KEY not configured.",
        )

    upstream_url = f"https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png"
    client: httpx.AsyncClient = request.app.state.app_state.http

    upstream_headers: dict[str, str] = {}
    inm = request.headers.get("if-none-match")
    ims = request.headers.get("if-modified-since")

    if inm:
        upstream_headers["if-none-match"] = inm
    if ims:
        upstream_headers["if-modified-since"] = ims

    try:
        r = await client.get(
            upstream_url,
            params={"appid": api_key},
            headers=upstream_headers or None,
        )
    except httpx.TimeoutException as exc:
        raise api_error(504, "UPSTREAM_TIMEOUT", "Upstream timeout.") from exc
    except httpx.RequestError as exc:
        raise api_error(502, "UPSTREAM_NETWORK", "Upstream request failed.") from exc

    headers_out: dict[str, str] = {
        "Cache-Control": f"public, max-age={_CACHE_SECONDS}",
    }

    etag = r.headers.get("etag")
    if etag:
        headers_out["ETag"] = etag

    last_modified = r.headers.get("last-modified")
    if last_modified:
        headers_out["Last-Modified"] = last_modified

    if r.status_code == 304:
        return Response(status_code=304, headers=headers_out)

    if r.status_code != 200:
        raise api_error(
            502,
            "UPSTREAM_ERROR",
            f"Upstream returned status {r.status_code}.",
        )

    headers_out["Content-Type"] = "image/png"

    return Response(content=r.content, status_code=200, headers=headers_out)
