# Wispi — Backend

A FastAPI service providing air quality data, geocoding, map tile proxying, favorites, user authentication, and admin management for the Wispi frontend.

## Tech Stack

- Python 3.12, FastAPI, Uvicorn
- SQLAlchemy (async) + PostgreSQL, Alembic migrations
- httpx (async HTTP client)
- Pydantic + pydantic-settings (validation and config)
- bcrypt (password hashing), PyJWT (JWT)
- slowapi (rate limiting)

## Getting Started

### Requirements

- Python 3.12
- PostgreSQL
- An [OpenWeather](https://openweathermap.org/api) API key
- A [MapTiler](https://www.maptiler.com/) API key (proxied server-side; never exposed to the browser)

### Setup — bare metal

Run from `aq_backend/`:

```bash
cp .env.example .env
# Fill in all required variables in .env
# For host-only Postgres, change DATABASE_URL host from `db` to `localhost`
pip install -r requirements.txt
alembic upgrade head
uvicorn aq_backend.app:create_app --factory --host 0.0.0.0 --port 8000
```

### Setup — Docker Compose (local development)

Local Compose builds the backend image from source and skips the Caddy/`web` service (which is hardcoded to the production domain and only useful in prod). The frontend is run separately with `npm run dev` — see [`frontend.md`](./frontend.md).

From the project root:

```bash
cp aq_backend/.env.example aq_backend/.env
# Fill in OPENWEATHER_API_KEY, MAPTILER_KEY, JWT_SECRET (>=32 chars),
# ADMIN_KEY (>=32 chars), POSTGRES_PASSWORD. APP_ENV must be development/dev/local.
# DATABASE_URL should keep host `db` (the compose service name).

docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

This starts Postgres, runs Alembic migrations, and serves the backend on `http://127.0.0.1:8000`. The `migrate` and `backend` services build from [`Dockerfile.backend`](../Dockerfile.backend); the `web` service is disabled via a `prod-like` profile and won't start.

To stop and clean up:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
# Add -v to also wipe the Postgres volume
```

### Setup — Docker Compose (production)

Production pulls prebuilt images from GHCR and serves through Caddy on the configured domain. Run without the dev override:

```bash
docker compose up -d
```

## Environment Variables

| Variable                      | Description                                                       | Required     |
|-------------------------------|-------------------------------------------------------------------|--------------|
| `OPENWEATHER_API_KEY`         | OpenWeather API key                                               | Yes          |
| `MAPTILER_KEY`                | MapTiler API key (used by the tile proxy)                         | Yes          |
| `DATABASE_URL`                | Async PostgreSQL URL (`postgresql+asyncpg://...`)                 | Yes          |
| `JWT_SECRET`                  | Secret for signing JWTs (min 32 chars)                            | Yes          |
| `ADMIN_KEY`                   | Admin API key sent as `X-Admin-Key` header (min 32 chars)         | Yes          |
| `APP_ENV`                     | `development` / `dev` / `local` / `production` (default: `development`) | No     |
| `FRONTEND_ORIGINS`            | Comma-separated allowed CORS origins                              | In prod      |
| `DEV_ORIGINS`                 | CORS origins used when `APP_ENV` is dev/local (default: localhost:5173) | No     |
| `TRUSTED_PROXIES`             | Comma-separated proxy IPs allowed to set `X-Forwarded-For`        | In prod      |
| `JWT_ALGORITHM`               | JWT algorithm (default: `HS256`)                                  | No           |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime in minutes (default: `15`)                  | No           |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | Refresh token lifetime in days (default: `30`)                    | No           |
| `HTTP_TIMEOUT_S`              | Per-request upstream timeout in seconds (default: `6`)            | No           |
| `REQUEST_TIMEOUT_S`           | Whole-request middleware timeout in seconds (default: `12`)       | No           |
| `OW_TOTAL_BUDGET_S`           | Total upstream retry budget in seconds (default: `6`)             | No           |
| `OW_MAX_ATTEMPTS`             | Max upstream retry attempts (default: `3`)                        | No           |

`REQUEST_TIMEOUT_S` must be greater than `OW_TOTAL_BUDGET_S` so upstream retry handling can finish before the request budget expires.

The `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` variables in `.env.example` are consumed by Docker Compose to provision the database container; the backend itself only reads `DATABASE_URL`.

## API Endpoints

All endpoints are prefixed with `/api` when running behind the Caddy reverse proxy.

### Auth (`/auth`)

| Method   | Path                    | Auth          | Description                              |
|----------|-------------------------|---------------|------------------------------------------|
| `POST`   | `/auth/register`        | —             | Create account, returns access token     |
| `POST`   | `/auth/login`           | —             | Login, returns access token              |
| `POST`   | `/auth/refresh`         | Refresh cookie| Rotate refresh token, return new access  |
| `POST`   | `/auth/logout`          | Refresh cookie| Invalidate refresh token                 |
| `GET`    | `/auth/me`              | Bearer token  | Get current user info                    |
| `POST`   | `/auth/change-password` | Bearer token  | Change password (requires current one)   |
| `DELETE` | `/auth/me`              | Bearer token  | Delete own account                       |

### Favorites (`/favorites`) — Bearer token required

| Method   | Path                  | Description                              |
|----------|-----------------------|------------------------------------------|
| `GET`    | `/favorites`          | List the current user's favorite cities  |
| `POST`   | `/favorites`          | Add a favorite city                      |
| `DELETE` | `/favorites/{city_id}`| Remove a favorite city                   |

### Air Quality & Geocoding

| Method | Path                                                      | Description                          |
|--------|-----------------------------------------------------------|--------------------------------------|
| `GET`  | `/health`                                                 | Health check                         |
| `GET`  | `/geocode?q=<city>&limit=<1-10>`                          | Search for a city by name            |
| `GET`  | `/reverse-geocode?lat=<lat>&lon=<lon>`                    | Resolve coordinates to a place name  |
| `GET`  | `/air/current?lat=<lat>&lon=<lon>`                        | Current air quality at coordinates   |
| `GET`  | `/air/history?lat=<lat>&lon=<lon>&start=<unix>&end=<unix>`| Historical air quality               |

### Tile Proxy (`/tiles`)

| Method | Path                                  | Description                          |
|--------|---------------------------------------|--------------------------------------|
| `GET`  | `/tiles/ow/{layer}/{z}/{x}/{y}.png`   | OpenWeather meteorological tile      |
| `GET`  | `/tiles/mt/{z}/{x}/{y}.png`           | MapTiler base map tile               |

### Admin (`/admin`) — requires `X-Admin-Key` header

Generate a key with `openssl rand -hex 32` and set it as `ADMIN_KEY` in `.env`.

| Method   | Path                                                          | Description                          |
|----------|---------------------------------------------------------------|--------------------------------------|
| `GET`    | `/admin/users?nickname=<substr>&limit=<1-500>&offset=<n>`     | List users (filter + pagination)     |
| `PATCH`  | `/admin/users/{id}/password`                                  | Reset a user's password              |
| `DELETE` | `/admin/users/{id}`                                           | Delete a user account                |

## Project Structure

```
aq_backend/
├── app.py              # Application factory
├── config.py           # Settings (pydantic-settings)
├── alembic.ini         # Alembic config
├── migrations/         # Alembic migration scripts
├── dependencies.py     # FastAPI dependencies (get_current_user, require_admin, AppState)
├── ratelimit.py        # Rate limiting (slowapi)
├── http_errors.py      # Standardised error responses
├── log_config.py       # Logging setup
├── auth/               # Password hashing, JWT, auth dependencies
│   ├── utils.py
│   └── auth_deps.py
├── db/                 # Database layer
│   ├── database.py     # Async engine and session
│   ├── models.py       # SQLAlchemy ORM models (User, RefreshToken, FavoriteCity)
│   └── schemas.py      # Pydantic response schemas
├── middleware/         # Request timeout and logging middleware
├── routes/             # Route handlers
│   ├── auth.py         # Auth endpoints
│   ├── admin.py        # Admin endpoints
│   ├── air.py          # Air quality endpoints
│   ├── favorites.py    # Favorite cities endpoints
│   ├── geocode.py      # Geocode / reverse-geocode
│   ├── tiles.py        # OpenWeather + MapTiler tile proxy
│   └── health.py       # Health check
├── services/
│   └── openweather/    # OpenWeather client, retry logic
└── tests/              # Pytest suite
```
