""" Tile proxy route """

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, Request, Response

from aq_backend.dependencies import ow_service
from aq_backend.http_errors import api_error
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

    if x < 0 or y < 0:
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

    assert content is not None
    return Response(
        content=content,
        status_code=status_code,
        headers=headers_out,
        media_type="image/png",
    )
