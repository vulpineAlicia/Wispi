""" Tile service for fetching OpenWeather map tiles """

from __future__ import annotations

import httpx

from aq_backend.services.openweather.errors import (
    OpenWeatherUpstreamError,
    UpstreamMeta,
)
from aq_backend.services.openweather.transport import Endpoint, OpenWeatherTransport


class OpenWeatherTileService:
    """ Fetch OpenWeather map tiles with shared retry and budget handling """

    def __init__(
        self,
        client: httpx.AsyncClient,
        transport: OpenWeatherTransport,
        api_key: str,
    ):
        self._client = client
        self._transport = transport
        self._api_key = api_key

    async def get_tile(
        self,
        *,
        layer: str,
        z: int,
        x: int,
        y: int,
        headers: dict[str, str] | None = None,
    ) -> tuple[bytes | None, UpstreamMeta, dict[str, str], int]:
        """ Fetch an OpenWeather tile and preserve upstream headers """
        url = f"https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png"
        params = {"appid": self._api_key}

        response, meta = await self._transport.request(
            endpoint=Endpoint.TILE,
            send=lambda timeout_s: self._client.get(
                url,
                params=params,
                headers=headers,
                timeout=timeout_s,
            ),
        )

        passthrough_headers: dict[str, str] = {}

        etag = response.headers.get("etag")
        if etag:
            passthrough_headers["ETag"] = etag

        last_modified = response.headers.get("last-modified")
        if last_modified:
            passthrough_headers["Last-Modified"] = last_modified

        if response.status_code == 304:
            return None, meta, passthrough_headers, 304

        content_type = response.headers.get("content-type", "").lower()
        if "image/png" not in content_type:
            raise OpenWeatherUpstreamError(
                status_code=response.status_code,
                message="Upstream returned non-image tile",
                body=response.text[:2000],
                meta=meta,
            )

        return response.content, meta, passthrough_headers, response.status_code
