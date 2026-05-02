from httpx import AsyncClient

_LONDON = {"name": "London", "country": "GB", "lat": 51.5074, "lon": -0.1278}
_PARIS = {"name": "Paris", "country": "FR", "lat": 48.8566, "lon": 2.3522}


async def test_list_favorites_empty(client: AsyncClient, auth_headers):
    resp = await client.get("/favorites", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["items"] == []
    assert body["max"] == 10


async def test_favorites_requires_auth(client: AsyncClient):
    assert (await client.get("/favorites")).status_code == 401
    assert (await client.post("/favorites", json=_LONDON)).status_code == 401


async def test_add_favorite_returns_city(client: AsyncClient, auth_headers):
    resp = await client.post("/favorites", json=_LONDON, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "London"
    assert body["country"] == "GB"
    assert body["lat"] == 51.5074
    assert body["lon"] == -0.1278
    assert "id" in body


async def test_added_city_appears_in_list(client: AsyncClient, auth_headers):
    await client.post("/favorites", json=_LONDON, headers=auth_headers)
    resp = await client.get("/favorites", headers=auth_headers)
    assert resp.status_code == 200
    cities = resp.json()["items"]
    assert len(cities) == 1
    assert cities[0]["name"] == "London"


async def test_multiple_cities_ordered_by_creation(client: AsyncClient, auth_headers):
    await client.post("/favorites", json=_LONDON, headers=auth_headers)
    await client.post("/favorites", json=_PARIS, headers=auth_headers)
    cities = (await client.get("/favorites", headers=auth_headers)).json()["items"]
    assert len(cities) == 2
    assert cities[0]["name"] == "London"
    assert cities[1]["name"] == "Paris"


async def test_favorites_capped_at_10(client: AsyncClient, auth_headers):
    for i in range(10):
        r = await client.post(
            "/favorites",
            json={"name": f"City{i}", "country": "XX", "lat": float(i), "lon": float(i)},
            headers=auth_headers,
        )
        assert r.status_code == 201

    resp = await client.post(
        "/favorites",
        json={"name": "Overflow", "country": "XX", "lat": 0.0, "lon": 0.0},
        headers=auth_headers,
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == "FAVORITES_LIMIT"


async def test_remove_favorite(client: AsyncClient, auth_headers):
    city_id = (await client.post("/favorites", json=_LONDON, headers=auth_headers)).json()["id"]

    resp = await client.delete(f"/favorites/{city_id}", headers=auth_headers)
    assert resp.status_code == 204

    assert (await client.get("/favorites", headers=auth_headers)).json()["items"] == []


async def test_remove_nonexistent_favorite_is_404(client: AsyncClient, auth_headers):
    resp = await client.delete(
        "/favorites/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_cannot_remove_another_users_city(client: AsyncClient, auth_headers):
    other_token = (
        await client.post("/auth/register", json={"password": "OtherPass1!"})
    ).json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    city_id = (await client.post("/favorites", json=_PARIS, headers=other_headers)).json()["id"]

    resp = await client.delete(f"/favorites/{city_id}", headers=auth_headers)
    assert resp.status_code == 404


async def test_remove_favorite_requires_auth(client: AsyncClient, auth_headers):
    city_id = (await client.post("/favorites", json=_LONDON, headers=auth_headers)).json()["id"]
    assert (await client.delete(f"/favorites/{city_id}")).status_code == 401


async def test_city_country_can_be_null(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/favorites",
        json={"name": "Unknown City", "country": None, "lat": 0.0, "lon": 0.0},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["country"] is None
