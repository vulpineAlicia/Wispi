""" Service layer for OpenWeather API calls """

from __future__ import annotations

from typing import Any

import httpx

from aq_backend.services.openweather.errors import (
    OpenWeatherUpstreamError,
    UpstreamMeta,
)
from aq_backend.services.openweather.tiles_service import OpenWeatherTileService
from aq_backend.services.openweather.transport import Endpoint, OpenWeatherTransport


class OpenWeatherService:
    """ Service for calling OpenWeather endpoints using a shared AsyncClient """

    def __init__(
        self,
        client: httpx.AsyncClient,
        api_key: str,
        geocode_url: str,
        reverse_geocode_url: str,
        air_url: str,
        history_url: str,
        *,
        total_budget_s: float = 6.0,
        max_attempts: int = 3,
    ):
        self._client = client
        self._api_key = api_key
        self._geocode_url = geocode_url
        self._reverse_geocode_url = reverse_geocode_url
        self._air_url = air_url
        self._history_url = history_url

        self._transport = OpenWeatherTransport(
            total_budget_s=total_budget_s,
            max_attempts=max_attempts,
        )
        self._tiles = OpenWeatherTileService(
            client=client,
            transport=self._transport,
            api_key=api_key,
        )

    async def _get_json(
        self,
        url: str,
        params: dict[str, Any],
        *,
        endpoint: Endpoint,
    ) -> tuple[Any, UpstreamMeta]:
        response, meta = await self._transport.request(
            endpoint=endpoint,
            send=lambda timeout_s: self._client.get(
                url,
                params=params,
                timeout=timeout_s,
            ),
        )

        try:
            return response.json(), meta
        except ValueError as exc:
            raise OpenWeatherUpstreamError(
                status_code=response.status_code,
                message="Upstream returned non-JSON response",
                body=response.text[:2000],
                meta=UpstreamMeta(
                    endpoint=endpoint.value,
                    attempts=meta.attempts,
                    total_ms=meta.total_ms,
                    last_status=response.status_code,
                    retry_after_s=None,
                    error="non_json",
                ),
            ) from exc

    async def get_tile(
        self,
        *,
        layer: str,
        z: int,
        x: int,
        y: int,
        headers: dict[str, str] | None = None,
    ) -> tuple[bytes | None, UpstreamMeta, dict[str, str], int]:
        """ Fetch an OpenWeather tile """
        return await self._tiles.get_tile(
            layer=layer,
            z=z,
            x=x,
            y=y,
            headers=headers,
        )

    async def geocode(
        self,
        q: str,
        limit: int,
    ) -> tuple[Any, UpstreamMeta]:
        """ Accept a city name and return location matches from OpenWeather """
        params = {
            "q": q,
            "limit": limit,
            "appid": self._api_key,
        }
        data, meta = await self._get_json(
            self._geocode_url,
            params=params,
            endpoint=Endpoint.GEOCODE,
        )
        return data, meta

    async def reverse_geocode(
        self,
        lat: float,
        lon: float,
    ) -> tuple[Any, UpstreamMeta]:
        """ Accept lat/lon and return location matches from OpenWeather reverse geocoding """
        params = {
            "lat": lat,
            "lon": lon,
            "limit": 1,
            "appid": self._api_key,
        }
        data, meta = await self._get_json(
            self._reverse_geocode_url,
            params=params,
            endpoint=Endpoint.REVERSE_GEOCODE,
        )
        return data, meta

    async def air_current(
        self,
        lat: float,
        lon: float,
    ) -> tuple[Any, UpstreamMeta]:
        """ Accept lat/lon and return current air quality data """
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self._api_key,
        }
        data, meta = await self._get_json(
            self._air_url,
            params=params,
            endpoint=Endpoint.AIR_CURRENT,
        )
        return data, meta

    async def air_history(
        self,
        lat: float,
        lon: float,
        start_ts: int,
        end_ts: int,
    ) -> tuple[Any, UpstreamMeta]:
        """ Return historical air quality measurements for a given time range """
        params = {
            "lat": lat,
            "lon": lon,
            "start": start_ts,
            "end": end_ts,
            "appid": self._api_key,
        }
        data, meta = await self._get_json(
            self._history_url,
            params=params,
            endpoint=Endpoint.AIR_HISTORY,
        )
        return data, meta
