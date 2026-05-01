from httpx import AsyncClient


async def test_register_success(client: AsyncClient):
    resp = await client.post("/auth/register", json={"password": "Password1!"})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert body["user"]["nickname"].count("-") == 2
    assert "wispi_refresh" in resp.cookies


async def test_register_password_too_short(client: AsyncClient):
    resp = await client.post("/auth/register", json={"password": "short"})
    assert resp.status_code == 422


async def test_register_password_too_long(client: AsyncClient):
    resp = await client.post("/auth/register", json={"password": "x" * 129})
    assert resp.status_code == 422


async def test_login_success(client: AsyncClient, registered_user):
    user, password, _ = registered_user
    resp = await client.post("/auth/login", json={"nickname": user["nickname"], "password": password})
    assert resp.status_code == 200
    assert resp.json()["user"]["id"] == user["id"]
    assert "wispi_refresh" in resp.cookies


async def test_login_wrong_password(client: AsyncClient, registered_user):
    user, _, _ = registered_user
    resp = await client.post("/auth/login", json={"nickname": user["nickname"], "password": "wrongpass"})
    assert resp.status_code == 401
    assert resp.json()["code"] == "INVALID_CREDENTIALS"


async def test_login_unknown_nickname(client: AsyncClient):
    resp = await client.post("/auth/login", json={"nickname": "nobody-here", "password": "Password1!"})
    assert resp.status_code == 401
    assert resp.json()["code"] == "INVALID_CREDENTIALS"


async def test_me_returns_current_user(client: AsyncClient, registered_user, auth_headers):
    user, _, _ = registered_user
    resp = await client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == user["id"]
    assert body["nickname"] == user["nickname"]


async def test_me_without_token_is_401(client: AsyncClient):
    assert (await client.get("/auth/me")).status_code == 401


async def test_me_with_invalid_token_is_401(client: AsyncClient):
    resp = await client.get("/auth/me", headers={"Authorization": "Bearer not.a.real.token"})
    assert resp.status_code == 401


async def test_refresh_issues_new_token(client: AsyncClient, registered_user):
    user, password, _ = registered_user
    login = await client.post("/auth/login", json={"nickname": user["nickname"], "password": password})
    cookie = login.cookies["wispi_refresh"]

    resp = await client.post("/auth/refresh")
    assert resp.status_code == 200
    assert "access_token" in resp.json()
    assert resp.cookies.get("wispi_refresh") != cookie


async def test_refresh_old_token_rejected_after_rotation(client: AsyncClient, registered_user):
    user, password, _ = registered_user
    login = await client.post("/auth/login", json={"nickname": user["nickname"], "password": password})
    old_cookie = login.cookies["wispi_refresh"]

    await client.post("/auth/refresh")
    client.cookies.set("wispi_refresh", old_cookie)
    resp = await client.post("/auth/refresh")
    assert resp.status_code == 401
    assert resp.json()["code"] == "INVALID_TOKEN"


async def test_refresh_missing_cookie_is_401(client: AsyncClient):
    resp = await client.post("/auth/refresh")
    assert resp.status_code == 401
    assert resp.json()["code"] == "MISSING_TOKEN"


async def test_logout_without_cookie_still_returns_ok(client: AsyncClient, auth_headers):
    resp = await client.post("/auth/logout", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["ok"] is True


async def test_logout_invalidates_refresh_token(client: AsyncClient, registered_user):
    user, password, _ = registered_user
    login = await client.post("/auth/login", json={"nickname": user["nickname"], "password": password})
    cookie = login.cookies["wispi_refresh"]

    await client.post("/auth/logout")
    client.cookies.set("wispi_refresh", cookie)
    resp = await client.post("/auth/refresh")
    assert resp.status_code == 401


async def test_change_password_success(client: AsyncClient, registered_user, auth_headers):
    resp = await client.post(
        "/auth/change-password",
        json={"old_password": "TestPass1!", "new_password": "NewPass99!"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["ok"] is True


async def test_change_password_revokes_all_sessions(client: AsyncClient, registered_user, auth_headers):
    user, password, _ = registered_user
    login = await client.post("/auth/login", json={"nickname": user["nickname"], "password": password})
    old_cookie = login.cookies["wispi_refresh"]

    await client.post(
        "/auth/change-password",
        json={"old_password": password, "new_password": "NewPass99!"},
        headers=auth_headers,
    )
    client.cookies.set("wispi_refresh", old_cookie)
    assert (await client.post("/auth/refresh")).status_code == 401


async def test_change_password_wrong_old_password(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/auth/change-password",
        json={"old_password": "wrongold!", "new_password": "NewPass99!"},
        headers=auth_headers,
    )
    assert resp.status_code == 401
    assert resp.json()["code"] == "INVALID_CREDENTIALS"


async def test_delete_account(client: AsyncClient, registered_user, auth_headers):
    resp = await client.delete("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert (await client.get("/auth/me", headers=auth_headers)).status_code == 401
