import time
from unittest.mock import AsyncMock

from httpx import AsyncClient

from aq_backend.services.openweather.errors import (
    OpenWeatherNetworkError,
    OpenWeatherTimeout,
    OpenWeatherUpstreamError,
    UpstreamMeta,
)

_META = UpstreamMeta(endpoint="air", attempts=1, total_ms=40, last_status=200)

_CURRENT_PAYLOAD = {
    "list": [
        {
            "dt": 1700000000,
            "main": {"aqi": 2},
            "components": {"pm2_5": 10.5, "pm10": 15.2, "no2": 3.1},
        }
    ]
}

_HISTORY_PAYLOAD = {
    "list": [
        {"dt": 1699913600, "main": {"aqi": 1}, "components": {"pm2_5": 8.0}},
        {"dt": 1700000000, "main": {"aqi": 3}, "components": {"pm2_5": 18.0}},
    ]
}


async def test_air_current_success(client: AsyncClient, mock_ow):
    mock_ow.air_current = AsyncMock(return_value=(_CURRENT_PAYLOAD, _META))

    resp = await client.get("/air/current?lat=51.5&lon=-0.1")
    assert resp.status_code == 200
    body = resp.json()
    assert body["aqi_ow_1_5"] == 2
    assert body["timestamp_unix"] == 1700000000
    assert body["location"]["lat"] == 51.5
    assert body["location"]["lon"] == -0.1
    assert body["source"] == "openweather"
    assert "pm2_5" in body["pollutants"]


async def test_air_current_no_data_returns_404(client: AsyncClient, mock_ow):
    mock_ow.air_current = AsyncMock(return_value=({"list": []}, _META))

    resp = await client.get("/air/current?lat=0.0&lon=0.0")
    assert resp.status_code == 404
    assert resp.json()["code"] == "NO_AIR_DATA"


async def test_air_current_missing_lat_is_422(client: AsyncClient):
    assert (await client.get("/air/current?lon=0.0")).status_code == 422


async def test_air_current_lat_out_of_range_is_422(client: AsyncClient):
    assert (await client.get("/air/current?lat=91.0&lon=0.0")).status_code == 422


async def test_air_current_upstream_timeout_returns_504(client: AsyncClient, mock_ow):
    mock_ow.air_current = AsyncMock(side_effect=OpenWeatherTimeout("timed out"))

    resp = await client.get("/air/current?lat=51.5&lon=-0.1")
    assert resp.status_code == 504
    assert resp.json()["code"] == "UPSTREAM_TIMEOUT"


async def test_air_current_upstream_network_error_returns_502(client: AsyncClient, mock_ow):
    mock_ow.air_current = AsyncMock(side_effect=OpenWeatherNetworkError("connection refused"))

    resp = await client.get("/air/current?lat=51.5&lon=-0.1")
    assert resp.status_code == 502
    assert resp.json()["code"] == "UPSTREAM_NETWORK"


async def test_air_current_upstream_5xx_returns_502(client: AsyncClient, mock_ow):
    err_meta = UpstreamMeta(endpoint="air", attempts=3, total_ms=200, last_status=503)
    mock_ow.air_current = AsyncMock(
        side_effect=OpenWeatherUpstreamError(status_code=503, message="server error", meta=err_meta)
    )

    resp = await client.get("/air/current?lat=51.5&lon=-0.1")
    assert resp.status_code == 502
    assert resp.json()["code"] == "UPSTREAM_5XX"


async def test_air_history_success(client: AsyncClient, mock_ow):
    mock_ow.air_history = AsyncMock(return_value=(_HISTORY_PAYLOAD, _META))

    resp = await client.get("/air/history?lat=51.5&lon=-0.1&days=7")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["items"]) == 2
    assert body["location"]["lat"] == 51.5
    assert body["source"] == "openweather"
    assert body["items"][0]["timestamp_unix"] < body["items"][1]["timestamp_unix"]


async def test_air_history_no_data_returns_404(client: AsyncClient, mock_ow):
    mock_ow.air_history = AsyncMock(return_value=({"list": []}, _META))

    resp = await client.get("/air/history?lat=0.0&lon=0.0&days=1")
    assert resp.status_code == 404
    assert resp.json()["code"] == "NO_HISTORY_DATA"


async def test_air_history_future_end_unix_is_400(client: AsyncClient, mock_ow):
    future_ts = int(time.time()) + 3600
    resp = await client.get(f"/air/history?lat=51.5&lon=-0.1&end_unix={future_ts}")
    assert resp.status_code == 400
    assert resp.json()["code"] == "INVALID_QUERY"


async def test_air_history_days_out_of_range_is_422(client: AsyncClient):
    assert (await client.get("/air/history?lat=0.0&lon=0.0&days=366")).status_code == 422
    assert (await client.get("/air/history?lat=0.0&lon=0.0&days=0")).status_code == 422


async def test_air_history_skips_malformed_entries(client: AsyncClient, mock_ow):
    payload = {
        "list": [
            {"dt": 1700000000, "main": {"aqi": 2}, "components": {}},
            {"dt": None, "main": {"aqi": 2}},          # malformed dt
            {"dt": 1699913600, "main": {"aqi": 99}},   # aqi out of range
        ]
    }
    mock_ow.air_history = AsyncMock(return_value=(payload, _META))

    resp = await client.get("/air/history?lat=0.0&lon=0.0&days=7")
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1
