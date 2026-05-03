""" Favorites routes: list, add, remove saved cities """

from __future__ import annotations

import asyncio
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from aq_backend.db.database import get_db
from aq_backend.auth.auth_deps import get_current_user
from aq_backend.dependencies import ow_service
from aq_backend.http_errors import api_error
from aq_backend.db.models import FavoriteCity, User
from aq_backend.ratelimit import FAVORITES_LIMIT, limiter
from aq_backend.db.schemas import AddFavoriteCityRequest, FavoriteCityOut, FavoritesListResponse
from aq_backend.services.openweather import OpenWeatherService

logger = logging.getLogger("aq_backend.favorites")

router = APIRouter(prefix="/favorites", tags=["favorites"])

# (lat_rounded, lon_rounded, lang) -> localized city name
_name_cache: dict[tuple[float, float, str], str] = {}


async def _resolve_name(
    stored: str,
    lat: float,
    lon: float,
    lang: str,
    service: OpenWeatherService,
) -> str:
    key = (round(lat, 4), round(lon, 4), lang)
    if key in _name_cache:
        return _name_cache[key]
    try:
        data, _ = await service.reverse_geocode(lat, lon)
        name = stored
        if isinstance(data, list) and data:
            item = data[0]
            local_names = item.get("local_names")
            localized = local_names.get(lang) if isinstance(local_names, dict) else None
            if isinstance(localized, str):
                name = localized
        _name_cache[key] = name
        return name
    except Exception:
        logger.warning("reverse_geocode failed for (%.4f, %.4f)", lat, lon)
        return stored

# Mirrored as MAX_FAVORITES in aq_frontend/src/contexts/FavoritesContext.tsx (UI guard only)
MAX_FAVORITES = 10


@router.get("", response_model=FavoritesListResponse)
async def list_favorites(
    lang: str = Query("en", min_length=2, max_length=10, description="Language code for city names"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    service: OpenWeatherService = Depends(ow_service),
) -> FavoritesListResponse:
    """ Return all saved cities for the authenticated user """
    rows = list(await db.scalars(
        select(FavoriteCity)
        .where(FavoriteCity.user_id == current_user.id)
        .order_by(FavoriteCity.created_at)
    ))
    names = await asyncio.gather(*[
        _resolve_name(r.name, r.lat, r.lon, lang, service) for r in rows
    ])
    return FavoritesListResponse(
        items=[
            FavoriteCityOut(id=r.id, name=names[i], country=r.country, lat=r.lat, lon=r.lon)
            for i, r in enumerate(rows)
        ],
        max=MAX_FAVORITES,
    )


@router.post("", response_model=FavoriteCityOut, status_code=201)
@limiter.limit(FAVORITES_LIMIT)
async def add_favorite(
    request: Request,
    body: AddFavoriteCityRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FavoriteCityOut:
    """ Save a city to the user's favourites (max 10) """
    # Lock the user row so concurrent requests from the same user queue up here
    # rather than racing past the count check and exceeding the limit.
    await db.execute(select(User).where(User.id == current_user.id).with_for_update())
    count = await db.scalar(
        select(func.count()).select_from(FavoriteCity).where(FavoriteCity.user_id == current_user.id)
    )
    if count >= MAX_FAVORITES:
        raise api_error(400, "FAVORITES_LIMIT", f"You can save up to {MAX_FAVORITES} cities.")

    city = FavoriteCity(
        user_id=current_user.id,
        name=body.name,
        country=body.country,
        lat=body.lat,
        lon=body.lon,
    )
    db.add(city)
    await db.commit()
    await db.refresh(city)

    return FavoriteCityOut(id=city.id, name=city.name, country=city.country, lat=city.lat, lon=city.lon)


@router.delete("/{city_id}", status_code=204)
@limiter.limit(FAVORITES_LIMIT)
async def remove_favorite(
    request: Request,
    city_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """ Remove a saved city (must belong to the authenticated user) """
    city = await db.scalar(
        select(FavoriteCity).where(
            FavoriteCity.id == str(city_id),
            FavoriteCity.user_id == current_user.id,
        )
    )
    if not city:
        raise api_error(404, "NOT_FOUND", "Favourite city not found.")

    await db.delete(city)
    await db.commit()
