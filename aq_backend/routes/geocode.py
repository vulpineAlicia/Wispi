""" Geocoding route """

from fastapi import APIRouter, Depends, Query, Request

from aq_backend.dependencies import ow_service
from aq_backend.ratelimit import GEOCODE_LIMIT, limiter
from aq_backend.db.schemas import GeocodeResponse, GeocodeResult
from aq_backend.services.openweather import OpenWeatherService

router = APIRouter(tags=["geocode"])


@router.get("/geocode", response_model=GeocodeResponse)
@limiter.limit(GEOCODE_LIMIT)
async def geocode(
    request: Request,
    q: str = Query(..., min_length=1, description="City name to search for"),
    limit: int = Query(5, ge=1, le=10, description="Maximum number of matches"),
    service: OpenWeatherService = Depends(ow_service),
) -> GeocodeResponse:
    """ Return geocoding matches for a city query """
    data, meta = await service.geocode(q=q, limit=limit)
    request.state.upstream = meta

    results: list[GeocodeResult] = []
    for item in data:
        if not isinstance(item, dict):
            continue

        name = item.get("name")
        country = item.get("country")
        lat_v = item.get("lat")
        lon_v = item.get("lon")
        state_v = item.get("state")

        if not isinstance(name, str) or not isinstance(country, str):
            continue

        try:
            lat_f = float(lat_v)
            lon_f = float(lon_v)
        except (TypeError, ValueError):
            continue

        state = state_v if isinstance(state_v, str) else None

        results.append(
            GeocodeResult(
                name=name,
                country=country,
                state=state,
                lat=lat_f,
                lon=lon_f,
            )
        )

    return GeocodeResponse(query=q, results=results)
