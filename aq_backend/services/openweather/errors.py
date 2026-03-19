""" Error types and metadata for OpenWeather upstream interactions """

from __future__ import annotations

from dataclasses import dataclass


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


class OpenWeatherUpstreamError(OpenWeatherError):
    """ Non-200 response from the upstream OpenWeather API """

    def __init__(
        self,
        *,
        status_code: int,
        message: str,
        body: str = "",
        retry_after: str | None = None,
        meta: UpstreamMeta | None = None,
    ):
        super().__init__(message, meta=meta)
        self.status_code = status_code
        self.body = body
        self.retry_after = retry_after


class OpenWeatherTimeout(OpenWeatherError):
    """ Upstream request times out """


class OpenWeatherNetworkError(OpenWeatherError):
    """ Network-level errors """


def message_for_status(status_code: int) -> str:
    """ Map HTTP status code to a user-facing upstream error message """
    if status_code in (401, 403):
        return "Upstream auth failed"
    if status_code == 429:
        return "Upstream rate limit"
    if 500 <= status_code <= 599:
        return "Upstream server error"
    return "Upstream request failed"
