""" Tile proxy route """

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, Request, Response

from aq_backend.config import get_settings
from aq_backend.dependencies import AppState, get_app_state, ow_service
from aq_backend.http_errors import api_error
from aq_backend.ratelimit import TILE_LIMIT, limiter
from aq_backend.services.openweather import OpenWeatherService

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
@limiter.limit(TILE_LIMIT)
async def openweather_tile(
    request: Request,
    layer: Layer,
    z: int,
    x: int,
    y: int,
    service: OpenWeatherService = Depends(ow_service),
) -> Response:
    """ Return OpenWeather tile """
    if z < 0 or z > _MAX_Z:
        raise api_error(400, "INVALID_QUERY", "Invalid zoom level.")

    max_tile = (1 << z) - 1
    if x < 0 or y < 0 or x > max_tile or y > max_tile:
        raise api_error(400, "INVALID_QUERY", "Invalid tile coordinates.")

    upstream_headers: dict[str, str] = {}
    inm = request.headers.get("if-none-match")
    ims = request.headers.get("if-modified-since")

    if inm:
        upstream_headers["If-None-Match"] = inm
    if ims:
        upstream_headers["If-Modified-Since"] = ims

    content, meta, passthrough_headers, status_code = await service.get_tile(
        layer=layer,
        z=z,
        x=x,
        y=y,
        headers=upstream_headers or None,
    )
    request.state.upstream = meta

    headers_out: dict[str, str] = {
        "Cache-Control": f"public, max-age={_CACHE_SECONDS}",
        **passthrough_headers,
    }

    if status_code == 304:
        return Response(status_code=304, headers=headers_out)

    if content is None:
        raise api_error(502, "UPSTREAM_ERROR", "Upstream returned empty tile content.")
    return Response(
        content=content,
        status_code=status_code,
        headers=headers_out,
        media_type="image/png",
    )


_MT_BASE = "https://api.maptiler.com/maps/base-v4"


@router.get("/mt/{z}/{x}/{y}.png")
@limiter.limit(TILE_LIMIT)
async def maptiler_tile(
    request: Request,
    z: int,
    x: int,
    y: int,
    state: AppState = Depends(get_app_state),
) -> Response:
    """ Proxy MapTiler base map tiles — keeps the API key server-side """
    if z < 0 or z > _MAX_Z:
        raise api_error(400, "INVALID_QUERY", "Invalid zoom level.")

    max_tile = (1 << z) - 1
    if x < 0 or y < 0 or x > max_tile or y > max_tile:
        raise api_error(400, "INVALID_QUERY", "Invalid tile coordinates.")

    url = f"{_MT_BASE}/{z}/{x}/{y}.png?key={get_settings().maptiler_key}"

    upstream_headers: dict[str, str] = {}
    inm = request.headers.get("if-none-match")
    ims = request.headers.get("if-modified-since")
    referer = request.headers.get("referer")
    if inm:
        upstream_headers["If-None-Match"] = inm
    if ims:
        upstream_headers["If-Modified-Since"] = ims
    if referer:
        upstream_headers["Referer"] = referer

    res = await state.http.get(url, headers=upstream_headers or None)

    passthrough: dict[str, str] = {}
    for h in ("ETag", "Last-Modified"):
        val = res.headers.get(h)
        if val:
            passthrough[h] = val

    headers_out = {"Cache-Control": f"public, max-age={_CACHE_SECONDS}", **passthrough}

    if res.status_code == 304:
        return Response(status_code=304, headers=headers_out)

    if not res.is_success:
        raise api_error(502, "UPSTREAM_ERROR", "Upstream returned an error.")

    return Response(
        content=res.content,
        status_code=res.status_code,
        headers=headers_out,
        media_type="image/png",
    )
