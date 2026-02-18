""" Air quality endpoints (current and history) """

from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from aq_backend.dependencies import ow_service
from aq_backend.models.schemas import (
    AirCurrentResponse,
    AirHistoryItem,
    AirHistoryResponse,
    Location,
)
from aq_backend.services.openweather import OpenWeatherService

router = APIRouter(tags=["air"])


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
    days: int = Query(7, ge=1, le=7),
    ow: OpenWeatherService = Depends(ow_service),
) -> AirHistoryResponse:
    """ Return air quality history for the last N days """
    end_ts = int(time.time())
    start_ts = end_ts - days * 86400

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
