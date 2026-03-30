""" Favorites routes: list, add, remove saved cities """

from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from aq_backend.database import get_db
from aq_backend.dependencies import get_current_user
from aq_backend.http_errors import api_error
from aq_backend.models import FavoriteCity, User
from aq_backend.ratelimit import limiter
from aq_backend.schemas import AddFavoriteCityRequest, FavoriteCityOut

router = APIRouter(prefix="/favorites", tags=["favorites"])

FAVORITES_LIMIT = "30/minute"
MAX_FAVORITES = 10


@router.get("", response_model=list[FavoriteCityOut])
async def list_favorites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[FavoriteCityOut]:
    """ Return all saved cities for the authenticated user """
    rows = await db.scalars(
        select(FavoriteCity)
        .where(FavoriteCity.user_id == current_user.id)
        .order_by(FavoriteCity.created_at)
    )
    return [
        FavoriteCityOut(id=r.id, name=r.name, country=r.country, lat=r.lat, lon=r.lon)
        for r in rows
    ]


@router.post("", response_model=FavoriteCityOut, status_code=201)
@limiter.limit(FAVORITES_LIMIT)
async def add_favorite(
    request: Request,
    body: AddFavoriteCityRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FavoriteCityOut:
    """ Save a city to the user's favourites (max 10) """
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


@router.delete("/{city_id}", status_code=200)
@limiter.limit(FAVORITES_LIMIT)
async def remove_favorite(
    request: Request,
    city_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """ Remove a saved city (must belong to the authenticated user) """
    city = await db.scalar(
        select(FavoriteCity).where(
            FavoriteCity.id == city_id,
            FavoriteCity.user_id == current_user.id,
        )
    )
    if not city:
        raise api_error(404, "NOT_FOUND", "Favourite city not found.")

    await db.delete(city)
    await db.commit()
    return {"ok": True}
