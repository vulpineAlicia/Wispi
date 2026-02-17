""" Pydantic schemas for API responses """

from __future__ import annotations

from pydantic import BaseModel, Field


class Location(BaseModel):
    """ Geographic coordinates """

    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class GeocodeResult(BaseModel):
    """ A geocoding match returned from the provider """

    name: str | None = None
    country: str | None = None
    state: str | None = None
    lat: float | None = None
    lon: float | None = None


class GeocodeResponse(BaseModel):
    """ Response for /geocode """

    query: str
    results: list[GeocodeResult]


class AirHistoryItem(BaseModel):
    """ One air pollution measurement entry """

    timestamp_unix: int
    aqi_ow_1_5: int = Field(ge=1, le=5)
    pollutants: dict[str, float] = Field(default_factory=dict)


class AirCurrentResponse(BaseModel):
    """ Response for /air/current """

    location: Location
    timestamp_unix: int
    aqi_ow_1_5: int = Field(ge=1, le=5)
    pollutants: dict[str, float] = Field(default_factory=dict)
    source: str = "openweather"


class AirHistoryResponse(BaseModel):
    """ Response for /air/history """

    location: Location
    start_unix: int
    end_unix: int
    items: list[AirHistoryItem]
    source: str = "openweather"
