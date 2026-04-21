""" Transport layer for OpenWeather requests with retry, backoff, and timeout handling """

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from enum import Enum

import httpx

from aq_backend.services.openweather.errors import (
    OpenWeatherNetworkError,
    OpenWeatherTimeout,
    OpenWeatherUpstreamError,
    UpstreamMeta,
    message_for_status,
)
from aq_backend.services.openweather.retry import (
    compute_backoff_s,
    is_retryable_status,
    parse_retry_after_s,
)

logger = logging.getLogger("aq_backend.transport")


class Endpoint(str, Enum):
    """ Known OpenWeather upstream endpoint kinds """

    GEOCODE = "geocode"
    AIR_CURRENT = "air_current"
    AIR_HISTORY = "air_history"
    TILE = "tile"


@dataclass(slots=True)
class AttemptState:
    """ Mutable state collected across retries for one upstream call """

    upstream_total_ms: float = 0.0
    last_status: int | None = None
    last_exc: Exception | None = None
    last_retry_after_s: float | None = None
    last_error: str | None = None
    attempts: int = 0


class OpenWeatherTransport:
    """ Shared retrying transport for OpenWeather requests """

    def __init__(
        self,
        *,
        total_budget_s: float = 6.0,
        max_attempts: int = 3,
    ):
        self._total_budget_s = total_budget_s
        self._max_attempts = max_attempts

    def _build_meta(
        self,
        *,
        endpoint: Endpoint,
        state: AttemptState,
        error: str | None = None,
    ) -> UpstreamMeta:
        return UpstreamMeta(
            endpoint=endpoint.value,
            attempts=state.attempts,
            total_ms=int(state.upstream_total_ms),
            last_status=state.last_status,
            retry_after_s=state.last_retry_after_s,
            error=error if error is not None else state.last_error,
        )

    @staticmethod
    async def _sleep_with_budget(deadline: float, wait_s: float) -> None:
        sleep_s = min(wait_s, max(0.0, deadline - time.monotonic()))
        await asyncio.sleep(sleep_s)

    async def request(
        self,
        *,
        endpoint: Endpoint,
        send: Callable[[float], Awaitable[httpx.Response]],
    ) -> tuple[httpx.Response, UpstreamMeta]:
        """ Execute request with retries and consistent error handling """
        deadline = time.monotonic() + self._total_budget_s
        state = AttemptState()

        for attempt in range(1, self._max_attempts + 1):
            state.attempts = attempt

            remaining_s = deadline - time.monotonic()
            if remaining_s <= 0:
                logger.warning(
                    "OW %s budget exceeded after %d attempt(s)",
                    endpoint.value, state.attempts,
                )
                raise OpenWeatherTimeout(
                    "Upstream budget exceeded",
                    meta=self._build_meta(
                        endpoint=endpoint,
                        state=state,
                        error="budget_exceeded",
                    ),
                )

            try:
                t0 = time.perf_counter()
                response = await send(max(0.1, remaining_s))
                state.upstream_total_ms += (time.perf_counter() - t0) * 1000.0
                state.last_status = response.status_code
            except httpx.TimeoutException as exc:
                state.last_exc = exc
                state.last_error = "timeout"

                if attempt == self._max_attempts:
                    raise OpenWeatherTimeout(
                        "Upstream timeout",
                        meta=self._build_meta(endpoint=endpoint, state=state),
                    ) from exc

                backoff_s = compute_backoff_s(attempt)
                logger.debug(
                    "OW %s timeout on attempt %d/%d, retrying in %.2fs",
                    endpoint.value, attempt, self._max_attempts, backoff_s,
                )
                await self._sleep_with_budget(deadline, backoff_s)
                continue
            except httpx.RequestError as exc:
                state.last_exc = exc
                state.last_error = "network"

                if attempt == self._max_attempts:
                    raise OpenWeatherNetworkError(
                        "Upstream network error",
                        meta=self._build_meta(endpoint=endpoint, state=state),
                    ) from exc

                backoff_s = compute_backoff_s(attempt)
                logger.debug(
                    "OW %s network error on attempt %d/%d (%s), retrying in %.2fs",
                    endpoint.value, attempt, self._max_attempts, exc, backoff_s,
                )
                await self._sleep_with_budget(deadline, backoff_s)
                continue

            retry_after_hdr = response.headers.get("Retry-After")
            retryable = is_retryable_status(response.status_code)

            if retryable and attempt < self._max_attempts:
                retry_after_s = None
                if response.status_code == 429 and retry_after_hdr:
                    retry_after_s = parse_retry_after_s(retry_after_hdr)
                    if retry_after_s is not None:
                        retry_after_s = min(retry_after_s, 10.0)

                state.last_retry_after_s = retry_after_s
                wait_s = (
                    retry_after_s
                    if retry_after_s is not None
                    else compute_backoff_s(attempt)
                )
                logger.debug(
                    "OW %s got %d on attempt %d/%d, retrying in %.2fs",
                    endpoint.value, response.status_code, attempt, self._max_attempts, wait_s,
                )
                await self._sleep_with_budget(deadline, wait_s)
                continue

            if response.is_error:
                state.last_retry_after_s = (
                    parse_retry_after_s(retry_after_hdr) if retry_after_hdr else None
                )
                raise OpenWeatherUpstreamError(
                    status_code=response.status_code,
                    message=message_for_status(response.status_code),
                    body=response.text[:2000],
                    retry_after=retry_after_hdr,
                    meta=self._build_meta(endpoint=endpoint, state=state, error="http_error"),
                )

            return response, self._build_meta(endpoint=endpoint, state=state)

        meta = self._build_meta(
            endpoint=endpoint,
            state=state,
            error=state.last_error or "fallback",
        )

        if isinstance(state.last_exc, httpx.TimeoutException):
            raise OpenWeatherTimeout("Upstream timeout", meta=meta) from state.last_exc

        if state.last_exc is not None:
            raise OpenWeatherNetworkError(
                "Upstream network error",
                meta=meta,
            ) from state.last_exc

        raise OpenWeatherUpstreamError(
            status_code=502,
            message="Upstream request failed",
            meta=meta,
        )
