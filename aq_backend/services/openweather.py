""" OpenWeather client (retries and consistent error handling) """

from __future__ import annotations

import asyncio
import random
import time
from dataclasses import dataclass
from email.utils import parsedate_to_datetime
from typing import Any, cast

import httpx


@dataclass(slots=True, frozen=True)
class UpstreamMeta:
    """ Metadata about the upstream call (internal) """

    endpoint: str
    attempts: int
    total_ms: int
    last_status: int | None
    retry_after_s: float | None = None
    error: str | None = None


class OpenWeatherError(Exception):
    """ Base class for all OW related failures """

    def __init__(self, message: str = "", *, meta: UpstreamMeta | None = None):
        super().__init__(message)
        self.meta = meta


@dataclass(frozen=True)
class OpenWeatherUpstreamError(OpenWeatherError):
    """ Non-200 response from the upstream OpenWeather API """

    status_code: int
    message: str
    body: str = ""
    retry_after: str | None = None
    meta: UpstreamMeta | None = None


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

    async def _get_json(
        self,
        url: str,
        params: dict[str, Any],
        *,
        endpoint: str,
    ) -> tuple[Any, UpstreamMeta]:
        """
        Fetch JSON from OpenWeather.

        Retries on:
        - timeouts
        - network errors
        - 5xx responses
        - 429 rate limits

        Returns: (data, meta)
        """
        deadline = time.monotonic() + self._total_budget_s

        attempts = 0
        upstream_total_ms = 0.0
        last_status: int | None = None
        last_exc: Exception | None = None
        last_retry_after_s: float | None = None
        last_error: str | None = None

        for attempt in range(1, self._max_attempts + 1):
            attempts = attempt

            remaining_s = deadline - time.monotonic()
            if remaining_s <= 0:
                meta = UpstreamMeta(
                    endpoint=endpoint,
                    attempts=attempts,
                    total_ms=int(upstream_total_ms),
                    last_status=last_status,
                    retry_after_s=last_retry_after_s,
                    error="budget_exceeded",
                )
                raise OpenWeatherTimeout("Upstream budget exceeded", meta=meta)

            try:
                t0 = time.perf_counter()
                r = await self._client.get(url, params=params)
                upstream_total_ms += (time.perf_counter() - t0) * 1000.0
                last_status = r.status_code

            except httpx.TimeoutException as exc:
                last_exc = exc
                last_error = "timeout"

                if attempt == self._max_attempts:
                    meta = UpstreamMeta(
                        endpoint=endpoint,
                        attempts=attempts,
                        total_ms=int(upstream_total_ms),
                        last_status=last_status,
                        retry_after_s=last_retry_after_s,
                        error=last_error,
                    )
                    raise OpenWeatherTimeout("Upstream timeout", meta=meta) from exc

                sleep_s = min(self._compute_backoff_s(attempt), max(0.0, deadline - time.monotonic()))
                await asyncio.sleep(sleep_s)
                continue

            except httpx.RequestError as exc:
                last_exc = exc
                last_error = "network"

                if attempt == self._max_attempts:
                    meta = UpstreamMeta(
                        endpoint=endpoint,
                        attempts=attempts,
                        total_ms=int(upstream_total_ms),
                        last_status=last_status,
                        retry_after_s=last_retry_after_s,
                        error=last_error,
                    )
                    raise OpenWeatherNetworkError("Upstream network error", meta=meta) from exc

                sleep_s = min(self._compute_backoff_s(attempt), max(0.0, deadline - time.monotonic()))
                await asyncio.sleep(sleep_s)
                continue

            # 200 OK
            if r.status_code == 200:
                try:
                    data = r.json()
                except ValueError as exc:
                    last_error = "non_json"
                    meta = UpstreamMeta(
                        endpoint=endpoint,
                        attempts=attempts,
                        total_ms=int(upstream_total_ms),
                        last_status=r.status_code,
                        retry_after_s=None,
                        error=last_error,
                    )
                    raise OpenWeatherUpstreamError(
                        status_code=502,
                        message="Upstream returned non-JSON response",
                        body=r.text[:2000],
                        meta=meta,
                    ) from exc

                meta = UpstreamMeta(
                    endpoint=endpoint,
                    attempts=attempts,
                    total_ms=int(upstream_total_ms),
                    last_status=r.status_code,
                )
                return data, meta

            # Non-200
            retry_after_hdr = r.headers.get("Retry-After")
            body = r.text[:2000]

            retryable = (r.status_code == 429) or (500 <= r.status_code <= 599)
            if retryable and attempt < self._max_attempts:
                wait_s: float | None = None

                if r.status_code == 429 and retry_after_hdr:
                    wait_s = self._parse_retry_after_s(retry_after_hdr)
                    if wait_s is not None:
                        wait_s = min(wait_s, 10.0)

                if wait_s is None:
                    wait_s = self._compute_backoff_s(attempt)

                last_retry_after_s = wait_s
                sleep_s = min(wait_s, max(0.0, deadline - time.monotonic()))
                await asyncio.sleep(sleep_s)
                continue

            if r.status_code in (401, 403):
                msg = "Upstream auth failed"
            elif r.status_code == 429:
                msg = "Upstream rate limit"
            elif 500 <= r.status_code <= 599:
                msg = "Upstream server error"
            else:
                msg = "Upstream request failed"

            last_error = "http_error"
            meta = UpstreamMeta(
                endpoint=endpoint,
                attempts=attempts,
                total_ms=int(upstream_total_ms),
                last_status=r.status_code,
                retry_after_s=self._parse_retry_after_s(retry_after_hdr) if retry_after_hdr else None,
                error=last_error,
            )
            raise OpenWeatherUpstreamError(
                status_code=r.status_code,
                message=msg,
                body=body,
                retry_after=retry_after_hdr,
                meta=meta,
            )

        # Fallback
        meta = UpstreamMeta(
            endpoint=endpoint,
            attempts=attempts,
            total_ms=int(upstream_total_ms),
            last_status=last_status,
            retry_after_s=last_retry_after_s,
            error=last_error or "fallback",
        )

        if isinstance(last_exc, httpx.TimeoutException):
            raise OpenWeatherTimeout("Upstream timeout", meta=meta) from last_exc
        if last_exc is not None:
            raise OpenWeatherNetworkError("Upstream network error", meta=meta) from last_exc
        raise OpenWeatherUpstreamError(status_code=502, message="Upstream request failed", meta=meta)

    async def geocode(self, q: str, limit: int) -> tuple[list[dict[str, Any]], UpstreamMeta]:
        """ Accepts city name and returns location matches from OW geocoding API """
        params = {"q": q, "limit": limit, "appid": self._api_key}
        data, meta = await self._get_json(self._geocode_url, params=params, endpoint="geocode")
        return cast(list[dict[str, Any]], data), meta

    async def air_current(self, lat: float, lon: float) -> tuple[dict[str, Any], UpstreamMeta]:
        """ Accepts lat/lon and returns current air quality data for location """
        params = {"lat": lat, "lon": lon, "appid": self._api_key}
        data, meta = await self._get_json(self._air_url, params=params, endpoint="air_current")
        return cast(dict[str, Any], data), meta

    async def air_history(
        self,
        lat: float,
        lon: float,
        start_ts: int,
        end_ts: int,
    ) -> tuple[dict[str, Any], UpstreamMeta]:
        """ Return historical air quality measurements for the given time range """
        params = {"lat": lat, "lon": lon, "start": start_ts, "end": end_ts, "appid": self._api_key}
        data, meta = await self._get_json(self._history_url, params=params, endpoint="air_history")
        return cast(dict[str, Any], data), meta
