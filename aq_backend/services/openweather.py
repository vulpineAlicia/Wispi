""" OpenWeather client (retries and consistent error handling) """

from __future__ import annotations

import asyncio
import random
import time
from dataclasses import dataclass
from email.utils import parsedate_to_datetime
from typing import Any, cast

import httpx
from fastapi import Request


class OpenWeatherError(Exception):
    """ Base class for all OW related failures """


@dataclass(frozen=True)
class OpenWeatherUpstreamError(OpenWeatherError):
    """ Non-200 response from the upstream OpenWeather API """

    status_code: int
    message: str
    body: str = ""
    retry_after: str | None = None


class OpenWeatherTimeout(OpenWeatherError):
    """ Upstream request times out """


class OpenWeatherNetworkError(OpenWeatherError):
    """ Network-level errors """


class OpenWeatherService:
    """ Service for calling OpenWeather endpoints using a shared AsyncClient """   
    def __init__(
        self,
        client: httpx.AsyncClient,
        api_key: str,
        geocode_url: str,
        air_url: str,
        history_url: str,
        *,
        total_budget_s: float = 6.0,
        max_attempts: int = 3,
    ):
        self._client = client
        self._api_key = api_key
        self._geocode_url = geocode_url
        self._air_url = air_url
        self._history_url = history_url

        self._total_budget_s = total_budget_s
        self._max_attempts = max_attempts

    @staticmethod
    def _compute_backoff_s(attempt: int, *, base: float = 0.3, cap: float = 5.0) -> float:
        """ Compute backoff delay before retrying the request """
        delay = min(cap, base * (2 ** (attempt - 1)))
        return delay * random.uniform(0.8, 1.2)

    @staticmethod
    def _parse_retry_after_s(value: str) -> float | None:
        """ Parse Retry-After header into seconds; supports seconds or HTTP date """
        value = value.strip()
        if not value:
            return None

        # seconds
        try:
            seconds = float(value)
            if seconds < 0:
                return None
            return seconds
        except ValueError:
            pass

        # HTTP-date
        try:
            dt = parsedate_to_datetime(value)
            return max(0.0, dt.timestamp() - time.time())
        except (TypeError, ValueError, OSError):
            return None

    @staticmethod
    def _record_upstream_metrics(
        request: Request | None,
        upstream_total_ms: float,
        attempts_used: int,
        upstream_status: int | None = None,
        upstream_endpoint: str | None = None,
    ) -> None:
        """ Store upstream timing and status info on request.state (if available) """
        if request is None:
            return
        request.state.upstream_ms = upstream_total_ms
        request.state.upstream_tries = attempts_used
        if upstream_status is not None:
            request.state.upstream_status = upstream_status
        if upstream_endpoint is not None:
            request.state.upstream_endpoint = upstream_endpoint

    async def _get_json(
        self,
        url: str,
        params: dict[str, Any],
        request: Request | None = None,
        *,
        endpoint: str = "-",
    ) -> Any:
        """
        Fetch JSON from OpenWeather

        Retries on:
        - timeouts
        - network errors
        - 5xx responses
        - 429 rate limits

        """
        total_budget_s = self._total_budget_s
        max_attempts = self._max_attempts
        deadline = time.monotonic() + total_budget_s

        upstream_total_ms = 0.0
        attempts_used = 0
        last_exc: Exception | None = None

        for attempt in range(1, max_attempts + 1):
            attempts_used = attempt

            if time.monotonic() >= deadline:
                self._record_upstream_metrics(
                    request, upstream_total_ms, attempts_used, upstream_endpoint=endpoint
                )
                raise OpenWeatherTimeout()

            try:
                t0 = time.perf_counter()
                r = await self._client.get(url, params=params)
                upstream_total_ms += (time.perf_counter() - t0) * 1000.0

            except httpx.TimeoutException as exc:
                last_exc = exc
                if attempt == max_attempts:
                    self._record_upstream_metrics(
                        request, upstream_total_ms, attempts_used, upstream_endpoint=endpoint
                    )
                    raise OpenWeatherTimeout() from exc

                sleep_s = self._compute_backoff_s(attempt)
                await asyncio.sleep(min(sleep_s, max(0.0, deadline - time.monotonic())))
                continue

            except httpx.RequestError as exc:
                last_exc = exc
                if attempt == max_attempts:
                    self._record_upstream_metrics(
                        request, upstream_total_ms, attempts_used, upstream_endpoint=endpoint
                    )
                    raise OpenWeatherNetworkError() from exc

                sleep_s = self._compute_backoff_s(attempt)
                await asyncio.sleep(min(sleep_s, max(0.0, deadline - time.monotonic())))
                continue

            # Success
            if r.status_code == 200:
                try:
                    data = r.json()
                except ValueError as exc:
                    self._record_upstream_metrics(
                        request,
                        upstream_total_ms,
                        attempts_used,
                        upstream_status=r.status_code,
                        upstream_endpoint=endpoint,
                    )
                    raise OpenWeatherUpstreamError(
                        status_code=502,
                        message="Upstream returned non-JSON response",
                        body=r.text[:2000],
                    ) from exc

                self._record_upstream_metrics(
                    request,
                    upstream_total_ms,
                    attempts_used,
                    upstream_status=r.status_code,
                    upstream_endpoint=endpoint,
                )
                return data

            retry_after_hdr = r.headers.get("Retry-After")
            body = r.text[:2000]

            retryable = (r.status_code == 429) or (500 <= r.status_code <= 599)

            if retryable and attempt < max_attempts:
                wait_s: float | None = None

                if r.status_code == 429 and retry_after_hdr:
                    wait_s = self._parse_retry_after_s(retry_after_hdr)
                    if wait_s is not None:
                        wait_s = min(wait_s, 10.0)

                if wait_s is None:
                    wait_s = self._compute_backoff_s(attempt)

                await asyncio.sleep(min(wait_s, max(0.0, deadline - time.monotonic())))
                continue

            if r.status_code in (401, 403):
                msg = "Upstream auth failed"
            elif r.status_code == 429:
                msg = "Upstream rate limit"
            elif 500 <= r.status_code <= 599:
                msg = "Upstream server error"
            else:
                msg = "Upstream request failed"

            self._record_upstream_metrics(
                request,
                upstream_total_ms,
                attempts_used,
                upstream_status=r.status_code,
                upstream_endpoint=endpoint,
            )
            raise OpenWeatherUpstreamError(
                status_code=r.status_code,
                message=msg,
                body=body,
                retry_after=retry_after_hdr,
            )

        # Fallback
        self._record_upstream_metrics(request, upstream_total_ms, attempts_used, upstream_endpoint=endpoint)
        if isinstance(last_exc, httpx.TimeoutException):
            raise OpenWeatherTimeout() from last_exc
        if last_exc is not None:
            raise OpenWeatherNetworkError() from last_exc
        raise OpenWeatherUpstreamError(status_code=502, message="Upstream request failed")

    async def geocode(self, q: str, limit: int, request: Request | None = None) -> list[dict[str, Any]]:
        """" Accepts city name, returns location matches (in format lat, lon) for a city name from OpenWeather geocoding API """
        params = {"q": q, "limit": limit, "appid": self._api_key}
        data = await self._get_json(self._geocode_url, params=params, request=request, endpoint="geocode")
        return cast(list[dict[str, Any]], data)

    async def air_current(self, lat: float, lon: float, request: Request | None = None) -> dict[str, Any]:
        """" Accepts lat, lon and returns current air quality data for location """
        params = {"lat": lat, "lon": lon, "appid": self._api_key}
        data = await self._get_json(self._air_url, params=params, request=request, endpoint="air_current")
        return cast(dict[str, Any], data)

    async def air_history(
        self,
        lat: float,
        lon: float,
        start_ts: int,
        end_ts: int,
        request: Request | None = None,
    ) -> dict[str, Any]:
        """ Return historical air quality measurements for the given time range """
        params = {"lat": lat, "lon": lon, "start": start_ts, "end": end_ts, "appid": self._api_key}
        data = await self._get_json(self._history_url, params=params, request=request, endpoint="air_history")
        return cast(dict[str, Any], data)
