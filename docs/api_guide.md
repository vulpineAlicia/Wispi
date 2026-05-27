Wispi API — quick reference

This file lists every public Wispi endpoint with a runnable curl example. Replace
`<...>` placeholders with real values and (for local development) swap
`https://wispi.monster` for `http://127.0.0.1:8000`.

======================================================================================

How to use this guide

  1. Pick the endpoint you need from the sections below.
  2. Copy its curl block.
  3. Substitute the placeholders (described under "Placeholders" below).
  4. Run it.

Responses are JSON unless otherwise noted (tile endpoints return PNG).

======================================================================================

Placeholders

  <password>
      A user password. Minimum 8 characters, maximum 128.

  <nickname>
      The auto-generated nickname returned by /api/auth/register. You don't choose
      one — the server generates it and returns it in the register response under
      `user.nickname`. Use it later for /api/auth/login.

  <token>     (a.k.a. "access token" / "bearer token")
      A short-lived JWT (15 minutes by default) returned by /api/auth/register,
      /api/auth/login, and /api/auth/refresh in the response body as
      `access_token`. Send it on protected endpoints as:
          Authorization: Bearer <token>
      When it expires you'll get 401 INVALID_TOKEN — call /api/auth/refresh to
      get a fresh one.

  <refresh_token>
      A long-lived opaque token (30 days by default) returned as an HttpOnly
      cookie named `wispi_refresh` by /api/auth/register, /api/auth/login, and
      /api/auth/refresh. You usually don't read its value — curl will pick it
      up automatically if you use `--cookie-jar`/`--cookie` (see below).
      It's required only by /api/auth/refresh and /api/auth/logout.

  <key>       (admin key)
      The value of `ADMIN_KEY` from the backend `.env`. Generate with
      `openssl rand -hex 32`. Send as the `X-Admin-Key` header on /api/admin/*.

  <lat>, <lon>
      Decimal degrees. Latitude in [-90, 90], longitude in [-180, 180].

  <unix_timestamp>
      Seconds since 1970-01-01 UTC.

  <city_id>
      UUID returned by POST /api/favorites in the `id` field.

  <layer>
      OpenWeather meteorological layer name (e.g. `PA0`, `WND`, `TA2`).

  <z>, <x>, <y>
      Standard XYZ tile coordinates.

======================================================================================

Capturing and reusing the refresh cookie with curl

Because `wispi_refresh` is HttpOnly, you typically let curl manage it via a
cookie jar:

  # Login and save the refresh cookie to ./cookies.txt
  curl -X POST https://wispi.monster/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"nickname": "<nickname>", "password": "<password>"}' \
    --cookie-jar ./cookies.txt

  # Later: refresh using the saved cookie
  curl -X POST https://wispi.monster/api/auth/refresh \
    --cookie ./cookies.txt \
    --cookie-jar ./cookies.txt

The access token (bearer) you must extract from the JSON response and pass
explicitly via `-H "Authorization: Bearer <token>"` on protected calls.

======================================================================================

Auth:

POST /api/auth/register
{"password": "<password>"}

curl -X POST https://wispi.monster/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"password": "<password>"}'

--------------------------------------------------------------------------------------

POST /api/auth/login
{"nickname": "<nickname>", "password": "<password>"}

curl -X POST https://wispi.monster/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nickname": "<nickname>", "password": "<password>"}'

--------------------------------------------------------------------------------------

POST /api/auth/refresh

curl -X POST https://wispi.monster/api/auth/refresh \
  --cookie "wispi_refresh=<refresh_token>"

--------------------------------------------------------------------------------------

POST /api/auth/logout

curl -X POST https://wispi.monster/api/auth/logout \
  --cookie "wispi_refresh=<refresh_token>"

--------------------------------------------------------------------------------------

GET /api/auth/me
Authorization: Bearer <token>

curl https://wispi.monster/api/auth/me \
  -H "Authorization: Bearer <token>"

--------------------------------------------------------------------------------------

POST /api/auth/change-password
Authorization: Bearer <token>
{"old_password": "<old_password>", "new_password": "<new_password>"}

curl -X POST https://wispi.monster/api/auth/change-password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"old_password": "<old_password>", "new_password": "<new_password>"}'

--------------------------------------------------------------------------------------

DELETE /api/auth/me
Authorization: Bearer <token>

curl -X DELETE https://wispi.monster/api/auth/me \
  -H "Authorization: Bearer <token>"

======================================================================================

Air quality:

GET /api/air/current?lat=<lat>&lon=<lon>

curl "https://wispi.monster/api/air/current?lat=<lat>&lon=<lon>"

--------------------------------------------------------------------------------------

GET /api/air/history?lat=<lat>&lon=<lon>&start=<unix_timestamp>&end=<unix_timestamp>

curl "https://wispi.monster/api/air/history?lat=<lat>&lon=<lon>&start=<unix_timestamp>&end=<unix_timestamp>"

--------------------------------------------------------------------------------------

GET /api/geocode?q=<city_name>&limit=<number>

curl "https://wispi.monster/api/geocode?q=<city_name>&limit=<number>"

--------------------------------------------------------------------------------------

GET /api/reverse-geocode?lat=<lat>&lon=<lon>

curl "https://wispi.monster/api/reverse-geocode?lat=<lat>&lon=<lon>"

--------------------------------------------------------------------------------------

GET /api/tiles/ow/<layer>/<z>/<x>/<y>.png

curl "https://wispi.monster/api/tiles/ow/<layer>/<z>/<x>/<y>.png" --output tile.png

--------------------------------------------------------------------------------------

GET /api/tiles/mt/<z>/<x>/<y>.png

curl "https://wispi.monster/api/tiles/mt/<z>/<x>/<y>.png" --output tile.png

======================================================================================

Favorites — all require Authorization: Bearer <token>

GET /api/favorites
Authorization: Bearer <token>

curl https://wispi.monster/api/favorites \
  -H "Authorization: Bearer <token>"

--------------------------------------------------------------------------------------

POST /api/favorites
Authorization: Bearer <token>
{"name": "<city_name>", "country": "<country_code>", "lat": <lat>, "lon": <lon>}

curl -X POST https://wispi.monster/api/favorites \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "<city_name>", "country": "<country_code>", "lat": <lat>, "lon": <lon>}'

--------------------------------------------------------------------------------------

DELETE /api/favorites/<city_id>
Authorization: Bearer <token>

curl -X DELETE "https://wispi.monster/api/favorites/<city_id>" \
  -H "Authorization: Bearer <token>"

======================================================================================

Admin — all require X-Admin-Key (run openssl rand -hex 32 to generate and copy to aq_backend/.env)

GET /api/admin/users

curl https://wispi.monster/api/admin/users \
  -H "X-Admin-Key: <key>" | python3 -m json.tool

--------------------------------------------------------------------------------------

GET /api/admin/users?nickname=<nickname>

curl "https://wispi.monster/api/admin/users?nickname=<nickname>" \
  -H "X-Admin-Key: <key>" | python3 -m json.tool

--------------------------------------------------------------------------------------

PATCH /api/admin/users/<user_id>/password
{"new_password": "<new_password>"}

curl -X PATCH "https://wispi.monster/api/admin/users/<user_id>/password" \
  -H "X-Admin-Key: <key>" \
  -H "Content-Type: application/json" \
  -d '{"new_password": "<new_password>"}'

--------------------------------------------------------------------------------------

DELETE /api/admin/users/<user_id>

curl -X DELETE "https://wispi.monster/api/admin/users/<user_id>" \
  -H "X-Admin-Key: <key>"

======================================================================================

Health:

GET /api/health

curl https://wispi.monster/api/health
