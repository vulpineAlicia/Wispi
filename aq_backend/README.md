# Wispi — Backend

A FastAPI service providing air quality data, geocoding, map tiles, user authentication, and admin management for the Wispi frontend.

## Tech Stack

- Python 3.12, FastAPI, Uvicorn
- SQLAlchemy (async) + PostgreSQL
- httpx (async HTTP client)
- Pydantic + pydantic-settings (validation and config)
- bcrypt (password hashing), python-jose (JWT)

## Getting Started

### Requirements

- Python 3.12
- PostgreSQL
- An [OpenWeather](https://openweathermap.org/api) API key

### Setup

Run from the project root:

```bash
cp .env.example .env
# Fill in all required variables in .env
pip install -r requirements.txt
uvicorn aq_backend.app:create_app --factory --host 0.0.0.0 --port 8000
```

Or with Docker Compose (recommended):

```bash
docker compose up --build
```

## Environment Variables

| Variable                      | Description                                                  | Required     |
|-------------------------------|--------------------------------------------------------------|--------------|
| `OPENWEATHER_API_KEY`         | OpenWeather API key                                          | Yes          |
| `DATABASE_URL`                | Async PostgreSQL URL (`postgresql+asyncpg://...`)            | Yes          |
| `JWT_SECRET`                  | Secret for signing JWTs (min 32 chars)                       | Yes          |
| `ADMIN_KEY`                   | Admin API key sent as `X-Admin-Key` header (min 32 chars)    | Yes          |
| `POSTGRES_DB`                 | PostgreSQL database name                                     | Yes          |
| `POSTGRES_USER`               | PostgreSQL user                                              | Yes          |
| `POSTGRES_PASSWORD`           | PostgreSQL password                                          | Yes          |
| `APP_ENV`                     | `development` or `production` (default: `development`)       | No           |
| `FRONTEND_ORIGINS`            | Comma-separated allowed CORS origins                         | In prod      |
| `JWT_ALGORITHM`               | JWT algorithm (default: `HS256`)                             | No           |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime in minutes (default: `15`)             | No           |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | Refresh token lifetime in days (default: `30`)               | No           |
| `HTTP_TIMEOUT_S`              | Per-request upstream timeout in seconds (default: `6`)       | No           |
| `REQUEST_TIMEOUT_S`           | Whole-request middleware timeout in seconds (default: `12`)  | No           |
| `OW_TOTAL_BUDGET_S`           | Total retry budget in seconds (default: `6`)                 | No           |
| `OW_MAX_ATTEMPTS`             | Max retry attempts (default: `3`)                            | No           |

In `development` mode, `localhost:5173` is allowed by default. In `production`, `FRONTEND_ORIGINS` is required.

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

### Air Quality

| Method | Path                                         | Description                        |
|--------|----------------------------------------------|------------------------------------|
| `GET`  | `/health`                                    | Health check                       |
| `GET`  | `/geocode?q=<city>&limit=<1-10>`             | Search for a city by name          |
| `GET`  | `/air/current?lat=<lat>&lon=<lon>`           | Current air quality at coordinates |
| `GET`  | `/air/history?lat=<lat>&lon=<lon>&start=<unix>&end=<unix>` | Historical air quality |
| `GET`  | `/ow/<layer>/<z>/<x>/<y>.png`               | Meteorological map tile            |

### Admin (`/admin`) — requires `X-Admin-Key` header

Generate a key: `openssl rand -hex 32`, set it as `ADMIN_KEY` in `.env`.

| Method   | Path                              | Description                         |
|----------|-----------------------------------|-------------------------------------|
| `GET`    | `/admin/users`                    | List all users                      |
| `GET`    | `/admin/users?nickname=<name>`    | Search users by nickname (substring)|
| `PATCH`  | `/admin/users/<id>/password`      | Reset a user's password             |
| `DELETE` | `/admin/users/<id>`               | Delete a user account               |

## Project Structure

```
aq_backend/
├── app.py              # Application factory
├── config.py           # Settings (pydantic-settings)
├── models.py           # SQLAlchemy ORM models (User, RefreshToken)
├── database.py         # Async engine and session
├── auth.py             # Password hashing, JWT, nickname generation
├── dependencies.py     # FastAPI dependencies (get_current_user, require_admin)
├── schemas.py          # Pydantic response schemas
├── ratelimit.py        # Rate limiting (slowapi)
├── http_errors.py      # Standardised error responses
├── log_config.py       # Logging setup
├── state.py            # Shared app state
├── middleware/         # Request timeout and logging middleware
├── routes/             # Route handlers
│   ├── auth.py         # Auth endpoints
│   ├── admin.py        # Admin endpoints
│   ├── air.py          # Air quality endpoints
│   ├── geocode.py      # Geocoding endpoint
│   ├── tiles.py        # Map tile proxy
│   └── health.py       # Health check
└── services/
    └── openweather/    # OpenWeather client, retry logic, tile service
```
