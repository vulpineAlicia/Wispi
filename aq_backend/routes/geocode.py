""" Geocoding endpoint """

from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from aq_backend.dependencies import ow_service
from aq_backend.schemas import GeocodeResponse, GeocodeResult
from aq_backend.services.openweather import OpenWeatherService

router = APIRouter(tags=["geocode"])

_CITY_RE = re.compile(r"^[A-Za-zА-Яа-яЁё]+([A-Za-zА-Яа-яЁё\s'.-]*[A-Za-zА-Яа-яЁё]+)?$")


@router.get("/geocode", response_model=GeocodeResponse)
async def geocode(
    request: Request,
    q: str = Query(..., min_length=2),
    limit: int = Query(5, ge=1, le=10),
    ow: OpenWeatherService = Depends(ow_service),
) -> GeocodeResponse:
    """ Accept city name, return matching coordinates (lat, lon) """
    q_clean = " ".join(q.split())

    if len(q_clean) < 2 or not _CITY_RE.fullmatch(q_clean):
        raise HTTPException(
            status_code=422,
            detail={"code": "INVALID_QUERY", "message": "Invalid city name."},
        )

    data, meta = await ow.geocode(q=q_clean, limit=limit)
    request.state.upstream = meta

    if not isinstance(data, list):
        raise HTTPException(
            status_code=502,
            detail={"code": "UPSTREAM_MALFORMED", "message": "Upstream returned malformed geocode payload."},
        )

    results: list[GeocodeResult] = []
    for item in data:
        if not isinstance(item, dict):
            continue

        name = item.get("name")
        country = item.get("country")
        lat_v = item.get("lat")
        lon_v = item.get("lon")

        if not isinstance(name, str) or not isinstance(country, str):
            continue

        try:
            lat_f = float(lat_v)
            lon_f = float(lon_v)
        except (TypeError, ValueError):
            continue

        results.append(
            GeocodeResult(
                name=name,
                country=country,
                state=item.get("state"),
                lat=lat_f,
                lon=lon_f,
            )
        )

        if len(results) >= limit:
            break

    return GeocodeResponse(query=q_clean, results=results)
