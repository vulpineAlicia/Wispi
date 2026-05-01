from unittest.mock import AsyncMock

from httpx import AsyncClient

from aq_backend.services.openweather.errors import UpstreamMeta

_META = UpstreamMeta(endpoint="geocode", attempts=1, total_ms=40, last_status=200)

_OW_TWO_RESULTS = [
    {"name": "London", "country": "GB", "state": "England", "lat": 51.5074, "lon": -0.1278},
    {"name": "London", "country": "CA", "state": "Ontario", "lat": 42.9849, "lon": -81.2453},
]


async def test_geocode_returns_results(client: AsyncClient, mock_ow):
    mock_ow.geocode = AsyncMock(return_value=(_OW_TWO_RESULTS, _META))

    resp = await client.get("/geocode?q=London")
    assert resp.status_code == 200
    body = resp.json()
    assert body["query"] == "London"
    assert len(body["results"]) == 2
    assert body["results"][0]["name"] == "London"
    assert body["results"][0]["country"] == "GB"
    assert body["results"][0]["state"] == "England"


async def test_geocode_empty_results(client: AsyncClient, mock_ow):
    mock_ow.geocode = AsyncMock(return_value=([], _META))

    resp = await client.get("/geocode?q=Atlantis")
    assert resp.status_code == 200
    body = resp.json()
    assert body["query"] == "Atlantis"
    assert body["results"] == []


async def test_geocode_skips_malformed_items(client: AsyncClient, mock_ow):
    bad_data = [
        {"name": "Good City", "country": "XX", "lat": 10.0, "lon": 20.0},
        {"name": None, "country": "XX", "lat": 10.0, "lon": 20.0},   # missing name
        {"name": "No Coords", "country": "XX", "lat": None, "lon": None},  # bad coords
    ]
    mock_ow.geocode = AsyncMock(return_value=(bad_data, _META))

    resp = await client.get("/geocode?q=test")
    assert resp.status_code == 200
    assert len(resp.json()["results"]) == 1
    assert resp.json()["results"][0]["name"] == "Good City"


async def test_geocode_missing_query_is_422(client: AsyncClient):
    resp = await client.get("/geocode")
    assert resp.status_code == 422


async def test_geocode_empty_query_is_422(client: AsyncClient):
    resp = await client.get("/geocode?q=")
    assert resp.status_code == 422


async def test_geocode_respects_limit_param(client: AsyncClient, mock_ow):
    mock_ow.geocode = AsyncMock(return_value=([], _META))

    await client.get("/geocode?q=London&limit=3")
    mock_ow.geocode.assert_called_once()
    _, kwargs = mock_ow.geocode.call_args
    assert kwargs.get("limit") == 3 or mock_ow.geocode.call_args[0][1] == 3
