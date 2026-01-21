import os
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")
if not API_KEY:
    raise RuntimeError("OPENWEATHER_API_KEY missing in .env")

GEOCODE_URL = "https://api.openweathermap.org/geo/1.0/direct"
AIR_URL = "https://api.openweathermap.org/data/2.5/air_pollution"

app = FastAPI(title="AQ Backend", version="0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    """Endpoint to verify that the server is running"""
    return {"status": "ok"}

@app.get("/api/geocode")
async def geocode(q: str = Query(..., min_length=2), limit: int = Query(5, ge=1, le=10)):
    """
    Get coordinates by location name

    Parameters:
    - q: city name to search for (2 chars min)
    - limit: maximum number of results to return (1–10)

    Returns:
    - query: original search string (what the user typed)
    - results: a list of matching locations, each containing:
        - name: city name
        - country: country code
        - state: state/region (if available)
        - lat: latitude
        - lon: longitude
        
    """

    params = {"q": q, "limit": limit, "appid": API_KEY}

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(GEOCODE_URL, params=params)

    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="Geocoding provider error")

    data = r.json()
    results = [
        {
            "name": item.get("name"),
            "country": item.get("country"),
            "state": item.get("state"),
            "lat": item.get("lat"),
            "lon": item.get("lon"),
        }
        for item in data
    ]
    return {"query": q, "results": results}

@app.get("/api/air/current")
async def air_current(lat: float = Query(...), lon: float = Query(...)):
    """
    Get current air pollution data for location

    Parameters:
    - lat: location latitude
    - lon: location longitude

    Returns:
    - location: latitude and longitude
    - timestamp_unix: unix timestamp of the air quality measurement
    - aqi_ow_1_5: air quality index on OpenWeather 1–5 scale
    - pollutants: concentrations of air pollutants
    - source: data provider

    """

    params = {"lat": lat, "lon": lon, "appid": API_KEY}

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(AIR_URL, params=params)

    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="Air provider error")

    payload = r.json()

    lst = payload.get("list") or []
    if not lst:
        raise HTTPException(status_code=404, detail="No air data for these coordinates")

    entry = lst[0]
    return {
        "location": {"lat": lat, "lon": lon},
        "timestamp_unix": entry.get("dt"),
        "aqi_ow_1_5": (entry.get("main") or {}).get("aqi"),
        "pollutants": entry.get("components") or {},
        "source": "openweather",
    }
