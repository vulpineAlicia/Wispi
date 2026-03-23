# Wispi — Backend

A FastAPI service that proxies OpenWeather API data to the Wispi frontend — air quality, geocoding, and map tiles.

## Tech Stack

- Python, FastAPI, Uvicorn
- httpx (async HTTP client)
- Pydantic (validation and config)

## Getting Started

### Requirements

- Python 3.12.13
- An [OpenWeather](https://openweathermap.org/api) API key

### Setup

1. Copy `.env.example` to `.env` and fill in the required variables
2. Install dependencies
3. Start the server

Execute next commands from the root dir: 
```bash
cp .env.example .env
pip install -r ../requirements.txt
uvicorn aq_backend.app:create_app --factory --host 0.0.0.0 --port 8000
```

## Environment Variables

| Variable              | Description                                                 | Required |
|-----------------------|-------------------------------------------------------------|----------|
| `OPENWEATHER_API_KEY` | OpenWeather API key                                         | Yes      |
| `APP_ENV`             | `development` or `production` (default: `development`)      | No       |
| `FRONTEND_ORIGINS`    | Comma-separated allowed CORS origins                        | In prod  |
| `HTTP_TIMEOUT_S`      | Per-request upstream timeout in seconds (default: `6`)      | No       |
| `REQUEST_TIMEOUT_S`   | Whole-request middleware timeout in seconds (default: `12`) | No       |
| `OW_TOTAL_BUDGET_S`   | Total retry budget in seconds (default: `6`)                | No       |
| `OW_MAX_ATTEMPTS`     | Max retry attempts (default: `3`)                           | No       |
| `LOG_LEVEL`           | Log level (default: `INFO`)                                 | No       |

In `development` mode, `localhost:5173` is allowed by default. In `production`, `FRONTEND_ORIGINS` is required.

## API Endpoints

| Method | Path                                | Description                        |
|--------|-------------------------------------|------------------------------------|
| `GET`  | `/health`                           | Health check                       |
| `GET`  | `/geocode?q=<city>&limit=<1-10>`    | Search for a city by name          |
| `GET`  | `/air/current?lat=&lon=`            | Current air quality at coordinates |
| `GET`  | `/air/history?lat=&lon=&days=`      | Historical air quality data        |
| `GET`  | `/tiles/ow/<layer>/<z>/<x>/<y>.png` | Meteorological map tile            |

**Available tile layers:** `temp`, `precipitation`

## Project Structure

```
aq_backend/
├── app.py              # Application factory
├── config.py           # Settings (Pydantic)
├── schemas.py          # Response models
├── dependencies.py     # FastAPI dependency injection
├── middleware/         # Request timeout and logging middleware
├── routes/             # API route handlers (air, geocode, health, tiles)
└── services/
    └── openweather/    # OpenWeather client, retry logic, tile service
```
