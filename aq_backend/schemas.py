""" Pydantic schemas for API responses """

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class UserOut(BaseModel):
    """ Public user info returned from auth endpoints """

    id: str
    nickname: str
    avatar_id: int


class UserAdminOut(UserOut):
    """ User info with admin-only fields """

    created_at: datetime


class Location(BaseModel):
    """ Geographic coordinates """

    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class GeocodeResult(BaseModel):
    """ A geocoding match returned from the provider """

    name: str
    country: str
    state: str | None = None
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class GeocodeResponse(BaseModel):
    """ Response for /geocode """

    query: str
    results: list[GeocodeResult]


class AirHistoryItem(BaseModel):
    """ One air pollution measurement entry """

    timestamp_unix: int = Field(ge=0)
    aqi_ow_1_5: int = Field(ge=1, le=5)
    pollutants: dict[str, float] = Field(default_factory=dict)


class AirCurrentResponse(BaseModel):
    """ Response for /air/current """

    location: Location
    timestamp_unix: int = Field(ge=0)
    aqi_ow_1_5: int = Field(ge=1, le=5)
    pollutants: dict[str, float] = Field(default_factory=dict)
    source: str = "openweather"


class AirHistoryResponse(BaseModel):
    """ Response for /air/history """

    location: Location
    start_unix: int = Field(ge=0)
    end_unix: int = Field(ge=0)
    items: list[AirHistoryItem]
    source: str = "openweather"


class FavoriteCityOut(BaseModel):
    """ A saved favourite city """

    id: str
    name: str
    country: str | None
    lat: float
    lon: float


class OkResponse(BaseModel):
    """ Generic success response for mutation endpoints """

    ok: bool = True


class AddFavoriteCityRequest(BaseModel):
    """ Request body for POST /favorites """

    name: str = Field(min_length=1, max_length=128)
    country: str | None = Field(default=None, max_length=64)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)

    @field_validator("lat", "lon")
    @classmethod
    def round_coordinate(cls, v: float) -> float:
        return round(v, 4)
