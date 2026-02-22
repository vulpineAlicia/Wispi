""" Air quality endpoints (current and history) """

from __future__ import annotations

import time
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from aq_backend.dependencies import ow_service
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


def _extract_ts_aqi(entry: dict[str, Any], *, err_detail: str) -> tuple[int, int]:
    ts = entry.get("dt")
    main = entry.get("main") or {}
    aqi = main.get("aqi")

    if ts is None or aqi is None:
        raise HTTPException(status_code=502, detail=err_detail)

    try:
        ts_i = int(ts)
        aqi_i = int(aqi)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=err_detail) from exc

    if not (1 <= aqi_i <= 5):
        raise HTTPException(status_code=502, detail="Upstream returned invalid AQI value")

    return ts_i, aqi_i


@router.get("/air/current", response_model=AirCurrentResponse)
async def air_current(
    request: Request,
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    ow: OpenWeatherService = Depends(ow_service),
) -> AirCurrentResponse:
    """ Return current air quality for a location """
    payload, meta = await ow.air_current(lat=lat, lon=lon)
    request.state.upstream = meta

    lst = payload.get("list") or []
    if not lst:
        raise HTTPException(status_code=404, detail="No air data for these coordinates")

    entry = lst[0]
    ts_i, aqi_i = _extract_ts_aqi(entry, err_detail="Upstream returned malformed air payload")
    pollutants = _as_float_dict(entry.get("components"))

    return AirCurrentResponse(
        location=Location(lat=lat, lon=lon),
        timestamp_unix=ts_i,
        aqi_ow_1_5=aqi_i,
        pollutants=pollutants,
        source="openweather",
    )


@router.get("/air/history", response_model=AirHistoryResponse)
async def air_history(
    request: Request,
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    days: int = Query(7, ge=1, le=MAX_HISTORY_DAYS),
    end_unix: Optional[int] = Query(
        None,
        ge=0,
        description="Optional end timestamp (unix). Default: now. Useful for archive navigation.",
    ),
    ow: OpenWeatherService = Depends(ow_service),
) -> AirHistoryResponse:
    """Return air quality history for the last N days

    - client chooses between 7/30/90 days;
    - server enforces max days to protect itself;
    - optional end_unix enables browsing past ranges.
    """
    now_ts = int(time.time())
    end_ts = int(end_unix) if end_unix is not None else now_ts

    if end_ts > now_ts + 60:
        raise HTTPException(status_code=400, detail="end_unix cannot be in the future")

    start_ts = end_ts - days * SECONDS_PER_DAY
    if start_ts < 0:
        start_ts = 0

    payload, meta = await ow.air_history(
        lat=lat,
        lon=lon,
        start_ts=start_ts,
        end_ts=end_ts,
    )
    request.state.upstream = meta

    lst = payload.get("list") or []
    if not lst:
        raise HTTPException(status_code=404, detail="No air history for these coordinates")

    items: list[AirHistoryItem] = []
    for entry in lst:
        ts_i, aqi_i = _extract_ts_aqi(entry, err_detail="Upstream returned malformed history payload")
        pollutants = _as_float_dict(entry.get("components"))
        items.append(AirHistoryItem(timestamp_unix=ts_i, aqi_ow_1_5=aqi_i, pollutants=pollutants))

    return AirHistoryResponse(
        location=Location(lat=lat, lon=lon),
        start_unix=start_ts,
        end_unix=end_ts,
        items=items,
        source="openweather",
    )
