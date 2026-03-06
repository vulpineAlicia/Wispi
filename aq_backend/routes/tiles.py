""" Tile proxy route """

from __future__ import annotations

from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException, Request, Response

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
        raise HTTPException(status_code=400, detail="Invalid z")
    if x < 0 or y < 0:
        raise HTTPException(status_code=400, detail="Invalid tile coords")

    settings = request.app.state.settings
    api_key = getattr(settings, "openweather_api_key", None)
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENWEATHER_API_KEY not configured")

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
        raise HTTPException(status_code=504, detail="Upstream timeout") from exc
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail="Upstream request failed") from exc

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
        raise HTTPException(status_code=502, detail=f"Upstream returned {r.status_code}")

    headers_out["Content-Type"] = "image/png"
    return Response(content=r.content, status_code=200, headers=headers_out)
