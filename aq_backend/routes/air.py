""" Air quality endpoints (current and history) """

from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, Depends, Query, Request

from aq_backend.dependencies import ow_service
from aq_backend.http_errors import api_error
from aq_backend.ratelimit import AIR_CURRENT_LIMIT, AIR_HISTORY_LIMIT, limiter
from aq_backend.schemas import (
    AirCurrentResponse,
    AirHistoryItem,
    AirHistoryResponse,
    Location,
)
from aq_backend.services.openweather import OpenWeatherService

router = APIRouter(tags=["air"])

SECONDS_PER_DAY = 86_400
MAX_HISTORY_DAYS = 365


def _as_float_dict(value: Any) -> dict[str, float]:
    if not isinstance(value, dict):
        return {}

    out: dict[str, float] = {}

    for k, v in value.items():
        try:
            out[str(k)] = float(v)
        except (TypeError, ValueError):
            continue

    return out


def _ensure_dict(value: Any, message: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise api_error(502, "UPSTREAM_MALFORMED", message)
    return value


def _extract_ts_aqi(entry: dict[str, Any]) -> tuple[int, int] | None:
    ts = entry.get("dt")
    main = entry.get("main") or {}
    aqi = main.get("aqi")

    if ts is None or aqi is None:
        return None

    try:
        ts_i = int(ts)
        aqi_i = int(aqi)
    except (TypeError, ValueError):
        return None

    if not (1 <= aqi_i <= 5):
        return None

    return ts_i, aqi_i


@router.get("/air/current", response_model=AirCurrentResponse)
@limiter.limit(AIR_CURRENT_LIMIT)
async def air_current(
    request: Request,
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    ow: OpenWeatherService = Depends(ow_service),
) -> AirCurrentResponse:
    """ Return current air quality for a location """
    payload, meta = await ow.air_current(lat=lat, lon=lon)
    request.state.upstream = meta

    payload = _ensure_dict(payload, "Upstream returned malformed air payload")

    lst = payload.get("list") or []
    if not lst:
        raise api_error(404, "NO_AIR_DATA", "No air quality data for this location.")

    entry = _ensure_dict(lst[0], "Upstream returned malformed air payload")

    result = _extract_ts_aqi(entry)
    if result is None:
        raise api_error(502, "UPSTREAM_MALFORMED", "Upstream returned malformed air payload")
    ts_i, aqi_i = result

    pollutants = _as_float_dict(entry.get("components"))

    return AirCurrentResponse(
        location=Location(lat=lat, lon=lon),
        timestamp_unix=ts_i,
        aqi_ow_1_5=aqi_i,
        pollutants=pollutants,
        source="openweather",
    )


@router.get("/air/history", response_model=AirHistoryResponse)
@limiter.limit(AIR_HISTORY_LIMIT)
async def air_history(
    request: Request,
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    days: int = Query(7, ge=1, le=MAX_HISTORY_DAYS),
    end_unix: int | None = Query(
        None,
        ge=0,
        description="Optional end timestamp (unix). Default: now. Useful for archive navigation.",
    ),
    ow: OpenWeatherService = Depends(ow_service),
) -> AirHistoryResponse:
    """ Return air quality history for the last N days """
    now_ts = int(time.time())
    end_ts = int(end_unix) if end_unix is not None else now_ts

    if end_ts > now_ts + 60:
        raise api_error(400, "INVALID_QUERY", "end_unix cannot be in the future.")

    start_ts = max(0, end_ts - days * SECONDS_PER_DAY)

    payload, meta = await ow.air_history(
        lat=lat,
        lon=lon,
        start_ts=start_ts,
        end_ts=end_ts,
    )
    request.state.upstream = meta

    payload = _ensure_dict(payload, "Upstream returned malformed history payload")

    lst = payload.get("list") or []
    if not lst:
        raise api_error(404, "NO_HISTORY_DATA", "No air quality history for this location.")

    items: list[AirHistoryItem] = []

    for entry in lst:
        if not isinstance(entry, dict):
            continue

        result = _extract_ts_aqi(entry)
        if result is None:
            continue
        ts_i, aqi_i = result

        pollutants = _as_float_dict(entry.get("components"))

        items.append(
            AirHistoryItem(
                timestamp_unix=ts_i,
                aqi_ow_1_5=aqi_i,
                pollutants=pollutants,
            )
        )

    if not items:
        raise api_error(404, "NO_HISTORY_DATA", "No air quality history for this location.")

    items.sort(key=lambda x: x.timestamp_unix)

    return AirHistoryResponse(
        location=Location(lat=lat, lon=lon),
        start_unix=start_ts,
        end_unix=end_ts,
        items=items,
        source="openweather",
    )
