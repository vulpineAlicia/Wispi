from httpx import AsyncClient

ADMIN_KEY = "a" * 32

_ADMIN = {"X-Admin-Key": ADMIN_KEY}


async def test_list_users_requires_key(client: AsyncClient):
    resp = await client.get("/admin/users")
    assert resp.status_code == 403


async def test_list_users_wrong_key(client: AsyncClient):
    resp = await client.get("/admin/users", headers={"X-Admin-Key": "wrong-key"})
    assert resp.status_code == 403
    assert resp.json()["code"] == "FORBIDDEN"


async def test_list_users_returns_registered_user(client: AsyncClient, registered_user):
    user, _, _ = registered_user
    resp = await client.get("/admin/users", headers=_ADMIN)
    assert resp.status_code == 200
    users = resp.json()
    assert any(u["id"] == user["id"] for u in users)


async def test_list_users_includes_created_at(client: AsyncClient, registered_user):
    resp = await client.get("/admin/users", headers=_ADMIN)
    assert resp.status_code == 200
    assert "created_at" in resp.json()[0]


async def test_list_users_nickname_filter(client: AsyncClient, registered_user):
    user, _, _ = registered_user
    prefix = user["nickname"][:5]
    resp = await client.get(f"/admin/users?nickname={prefix}", headers=_ADMIN)
    assert resp.status_code == 200
    assert all(prefix.lower() in u["nickname"].lower() for u in resp.json())


async def test_list_users_pagination(client: AsyncClient, registered_user):
    resp = await client.get("/admin/users?limit=1&offset=0", headers=_ADMIN)
    assert resp.status_code == 200
    assert len(resp.json()) <= 1


async def test_set_user_password(client: AsyncClient, registered_user):
    user, _, _ = registered_user
    resp = await client.patch(
        f"/admin/users/{user['id']}/password",
        json={"new_password": "AdminSet99!!"},
        headers=_ADMIN,
    )
    assert resp.status_code == 200
    assert resp.json()["ok"] is True

    login = await client.post(
        "/auth/login", json={"nickname": user["nickname"], "password": "AdminSet99!!"}
    )
    assert login.status_code == 200


async def test_set_password_nonexistent_user(client: AsyncClient):
    resp = await client.patch(
        "/admin/users/00000000-0000-0000-0000-000000000000/password",
        json={"new_password": "AdminSet99!!"},
        headers=_ADMIN,
    )
    assert resp.status_code == 404


async def test_delete_user(client: AsyncClient, registered_user):
    user, _, _ = registered_user
    resp = await client.delete(f"/admin/users/{user['id']}", headers=_ADMIN)
    assert resp.status_code == 200

    users = (await client.get("/admin/users", headers=_ADMIN)).json()
    assert not any(u["id"] == user["id"] for u in users)


async def test_delete_nonexistent_user(client: AsyncClient):
    resp = await client.delete(
        "/admin/users/00000000-0000-0000-0000-000000000000", headers=_ADMIN
    )
    assert resp.status_code == 404
