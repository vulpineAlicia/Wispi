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
        raise HTTPException(status_code=422, detail="Invalid city name")

    data, meta = await ow.geocode(q=q_clean, limit=limit)
    request.state.upstream = meta

    results: list[GeocodeResult] = [
        GeocodeResult(
            name=item.get("name"),
            country=item.get("country"),
            state=item.get("state"),
            lat=item.get("lat"),
            lon=item.get("lon"),
        )
        for item in data
    ]

    return GeocodeResponse(query=q_clean, results=results)
