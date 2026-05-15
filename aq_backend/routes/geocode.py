""" Geocoding route """

from fastapi import APIRouter, Depends, Query, Request

from aq_backend.dependencies import ow_service
from aq_backend.ratelimit import GEOCODE_LIMIT, limiter
from aq_backend.db.schemas import GeocodeResponse, GeocodeResult, ReverseGeocodeResponse
from aq_backend.services.openweather import OpenWeatherService

router = APIRouter(tags=["geocode"])

# (lat_rounded, lon_rounded, lang) -> (name, country) — keeps repeat lookups off the OW quota
_reverse_cache: dict[tuple[float, float, str], tuple[str, str | None]] = {}


@router.get("/geocode", response_model=GeocodeResponse)
@limiter.limit(GEOCODE_LIMIT)
async def geocode(
    request: Request,
    q: str = Query(..., min_length=1, description="City name to search for"),
    limit: int = Query(5, ge=1, le=10, description="Maximum number of matches"),
    lang: str = Query("en", min_length=2, max_length=10, description="Language code for city names"),
    service: OpenWeatherService = Depends(ow_service),
) -> GeocodeResponse:
    """ Return geocoding matches for a city query """
    data, meta = await service.geocode(q=q, limit=limit)
    request.state.upstream = meta

    results: list[GeocodeResult] = []
    for item in data:
        if not isinstance(item, dict):
            continue

        default_name = item.get("name")
        local_names = item.get("local_names")
        localized = local_names.get(lang) if isinstance(local_names, dict) else None
        name = localized if isinstance(localized, str) else default_name
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


@router.get("/reverse-geocode", response_model=ReverseGeocodeResponse)
@limiter.limit(GEOCODE_LIMIT)
async def reverse_geocode(
    request: Request,
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    lang: str = Query("en", min_length=2, max_length=10, description="Language code for city name"),
    service: OpenWeatherService = Depends(ow_service),
) -> ReverseGeocodeResponse:
    """ Return the localized city name (and country) for a coordinate """
    key = (round(lat, 4), round(lon, 4), lang)
    if key in _reverse_cache:
        name, country = _reverse_cache[key]
        return ReverseGeocodeResponse(name=name, country=country)

    data, meta = await service.reverse_geocode(lat, lon)
    request.state.upstream = meta

    name: str = ""
    country: str | None = None
    if isinstance(data, list) and data:
        item = data[0]
        if isinstance(item, dict):
            default_name = item.get("name")
            local_names = item.get("local_names")
            localized = local_names.get(lang) if isinstance(local_names, dict) else None
            if isinstance(localized, str):
                name = localized
            elif isinstance(default_name, str):
                name = default_name
            country_v = item.get("country")
            if isinstance(country_v, str):
                country = country_v

    _reverse_cache[key] = (name, country)
    return ReverseGeocodeResponse(name=name, country=country)
