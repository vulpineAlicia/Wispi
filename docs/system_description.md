================================================================================
WISPI — SYSTEM DESCRIPTION
================================================================================

The system consists of:

  * A React + TypeScript single-page application (the frontend), located in
    aq_frontend/.
  * A FastAPI + SQLAlchemy + Alembic backend service (the backend), located
    in aq_backend/.
  * A PostgreSQL database, accessed asynchronously by the backend.
  * A Caddy reverse-proxy / static-file server (the edge tier), configured by
    the project Caddyfile.
  * Two external HTTP services consumed by the backend:
      - OpenWeather (geocoding, current air quality, historical air quality,
        weather raster tiles).
      - MapTiler (base-map raster tiles).

The deployment is containerized: docker-compose.yml describes four long-lived
services (PostgreSQL, the FastAPI backend, and the `web` container which
bundles Caddy plus the built static frontend) plus one short-lived `migrate`
service that runs Alembic migrations before the backend starts. The
OpenWeather and MapTiler API keys are only ever loaded by the backend and
migrate containers — they never reach the browser.


================================================================================
FEATURES
================================================================================


--------------------------------------------------------------------------------
Function tree
--------------------------------------------------------------------------------

Main function:
    Provide users with information about the current and historical air
    quality in cities anywhere in the world, on an interactive map, with
    optional per-user personalization (saved cities).

The main function decomposes into the following subfunctions. Each subfunction
in turn decomposes into smaller user-visible operations.

(1) CITY SEARCH (text-based geocoding)
    Used on the Home, Map, Archive, and Favorites pages.

    - Entering a city name into a search box.
    - Sending a geocoding request to the backend (rate-limited).
    - Receiving up to five candidate matches per query — each match contains
      a city name, an ISO 3166-1 alpha-2 country code, an optional sub-national
      "state" string, and geographic coordinates.
    - Selecting the desired city from the dropdown.
    - The selected location is then propagated through the URL (lat, lon,
      name, country) so that links and refreshes preserve the selection.

(2) REVERSE GEOCODING (map-click selection)
    Used by the Map page.

    - Clicking any point on the Leaflet map.
    - Sending the clicked coordinates to the backend.
    - Receiving a localized city name and country code for that coordinate.
    - The backend keeps an in-process cache of repeat reverse-geocode lookups
      to reduce the load on the upstream provider.

(3) CURRENT AIR QUALITY VIEW
    Used on Home, Map, Archive (selected day), Favorites (one panel per card).

    - Sending a request for air-quality data at the selected coordinates.
    - Displaying the AQI as a colored pill on the OpenWeather 1–5 index
      scale (1 = good, 5 = very poor). This is not the US EPA 0–500 AQI.
    - Displaying pollutant concentrations: CO, NO, NO2, O3, SO2, PM2.5,
      PM10, NH3 (each returned as a float).
    - Displaying the timestamp of the measurement.

(4) HISTORICAL AIR-QUALITY DATA
    Used on the Map page (alongside the map) and on the dedicated Archive page.

    - Selecting a period:
        * presets: 24 hours, 7 days, 30 days;
        * custom range, on the Archive page, up to 365 days
          (MAX_HISTORY_DAYS = 365 in the backend).
    - On the Archive page, additionally selecting a specific calendar day
      as the end of the window; the chart re-anchors around that
      end_unix timestamp.
    - Sending a history request to the backend.
    - Rendering an interactive time-series chart (Recharts) of AQI over time.
    - Clicking a chart point to re-center the window on that day.

(5) MAP INTERACTION
    Used on the Map page.

    - Viewing a Leaflet base map; tiles come from MapTiler but are proxied
      through the backend so the API key never leaves the server.
    - Toggling one of the OpenWeather overlay layers:
        * temp_new          — temperature;
        * precipitation_new — precipitation;
      (the "none" option disables the overlay)
    - Selecting a location by clicking the map (triggers reverse geocoding,
      see subfunction 2).
    - Viewing the selected location’s air quality and history side-by-side
      with the map.

(6) USER ACCOUNT (AUTHENTICATION)
    Available from the /auth page.

    - Registration: the user provides only a password (≥ 8 characters);
      the server generates a random unique nickname and assigns a random
      avatar; on success an access JWT is returned and a refresh-token
      cookie is set.
    - Login: nickname + password.
    - Token refresh: the wispi_refresh HttpOnly cookie is exchanged for a
      new access token; refresh tokens are rotated (the old row is deleted,
      a new one inserted) on every refresh.
    - Logout: invalidates the refresh token and clears the cookie.
    - Current-user info: returns the authenticated user’s nickname and
      avatar.

(7) PROFILE MANAGEMENT (/profile, protected route)

    - Viewing the user’s nickname and avatar.
    - Changing the password: requires the old password; on success all
      refresh tokens for the user are revoked, forcing every other session
      to re-login.
    - Deleting the account: must be confirmed by typing the user’s own
      nickname; cascades to refresh tokens and favorite cities.

(8) SAVED CITIES (FAVORITES, /favorites, protected route)

    - Listing saved cities; each card fetches and displays the city’s
      current AQI on load.
    - Adding a city to favorites — capped at 10 cities per user. The server
      (favorites route, MAX_FAVORITES = 10) enforces the cap with a
      row-level lock that prevents concurrent over-saving, and returns the
      cap as `max` in every list response. The client uses that returned
      value to gate the "add" affordance.
    - Removing a city from favorites.
    - Navigating from a favorite card to the map view of that city.

(9) EDUCATIONAL CONTENT (/info)

    - Viewing FAQ entries about the AQI scale, the health effects of each
      pollutant, registration, account management, and how the service
      uses user data.

(10) STATIC INFORMATIONAL PAGES

    - Terms and Conditions (/terms), linked from the footer.

(11) LOCALIZATION

    - Switching between English and Russian.
    - The active language is persisted, and city names returned by the
      OpenWeather geocoder are requested in the active language via the
      lang query parameter.
    - UI strings are translated client-side using react-i18next; country
      codes are translated to country names with Intl.DisplayNames.


--------------------------------------------------------------------------------
User flows
--------------------------------------------------------------------------------

There are three distinct user-interaction patterns in Wispi: the anonymous
flow, the registration/login flow, and the authenticated-only flow.

(A) Anonymous user flow (typical session)

    1. The user opens the landing page (/, Home).
    2. They enter a city name in the search box.
    3. The frontend sends a geocoding request; a dropdown shows up to five
       candidate matches.
    4. The user selects one city.
    5. The frontend requests one day of air-quality history for that city,
       extracts the most recent measurement, and renders an AQI pill,
       pollutant table, and a "View on map" link.
    6. The user can then either:
         - open the Map page — the URL carries lat, lon, name, country in
           its query string; the map centers on the city; the side panel
           shows AQI and a 7-day chart; overlay layers can be toggled;
         - open the Archive page — a custom day range (up to 365 days)
           can be entered; the chart is interactive; clicking a day
           re-centers the window on that date;
         - open the Useful Info page to read about AQI and pollutants.
    7. On the map, the user can also click anywhere on the map; the
       clicked coordinates are sent to the backend for reverse geocoding;
       the resolved city name appears in the URL and panel, and the
       air-quality data is loaded for that point.

(B) Registration / login flow

    1. The user clicks "Sign in" in the header and navigates to /auth.
    2. On registration they enter only a password; the server assigns a
       random nickname and avatar.
    3. On success an access JWT is held in memory by the frontend, and a
       refresh-token cookie (wispi_refresh, HttpOnly, SameSite=Lax,
       30 days) is set by the server. The user is redirected to the
       home page.
    4. The frontend silently refreshes the access token via /auth/refresh
       whenever it is needed.

(C) Authenticated-only flow (favorites)

    1. The user has a selected city open (Home / Map / Archive).
    2. They press the heart-shaped favorite button.
    3. The frontend sends an add-favorite request; if the user already has
       10 cities saved, the server returns FAVORITES_LIMIT and the UI
       shows the corresponding error.
    4. The user later opens /favorites; each card fetches its own current
       AQI; cards can be removed or opened on the map.

(D) Profile flow

    1. The user opens /profile.
    2. They can change their password — this requires entering the old
       password; on success all other sessions are revoked.
    3. They can delete the account — this requires typing their own
       nickname to confirm; on success they are signed out and redirected
       to the home page.


================================================================================
DATABASE
================================================================================


--------------------------------------------------------------------------------
Purpose
--------------------------------------------------------------------------------

The PostgreSQL database persists data that must survive between sessions and
across backend restarts:

    * user identities and credentials (so a user can log in again);
    * refresh tokens (so an authenticated session can be transparently
      extended without re-entering credentials, and so it can be revoked
      on logout / password change / account deletion);
    * per-user lists of saved cities ("favorites").

The database is accessed asynchronously via SQLAlchemy 2.x ORM, and the
schema is managed by Alembic migrations under aq_backend/migrations/.

IMPORTANT ARCHITECTURAL POINT — there is no "air history" or "requests"
table in Wispi. All air-quality data, geocoding data, and tiles are fetched
on demand from the OpenWeather and MapTiler APIs each time the user makes a
query. The only caching is an in-process Python dictionary used to
deduplicate reverse-geocoding lookups, plus the HTTP cache headers
(Cache-Control, ETag, Last-Modified) emitted by the tile-proxy routes.

The PostgreSQL database therefore contains only three tables:
users, refresh_tokens, favorite_cities.


--------------------------------------------------------------------------------
ER model
--------------------------------------------------------------------------------

There are three tables, all centered on the users entity:

                ┌──────────────────────┐
                │       users          │
                │ id (PK, uuid)        │
                │ nickname (unique)    │
                │ avatar_id            │
                │ password_hash        │
                │ created_at           │
                └───────┬──────────────┘
                        │ 1
                        │
            ┌───────────┴───────────────┐
            │                           │
          N │                           │ N
 ┌──────────▼─────────────┐ ┌───────────▼─────────────┐
 │    refresh_tokens      │ │     favorite_cities     │
 │ id (PK, uuid)          │ │ id (PK, uuid)           │
 │ user_id (FK→users.id)  │ │ user_id (FK→users.id)   │
 │   ON DELETE CASCADE    │ │   ON DELETE CASCADE     │
 │ token_hash (unique)    │ │ name                    │
 │ expires_at             │ │ country (nullable)      │
 │ created_at             │ │ lat                     │
 │                        │ │ lon                     │
 │                        │ │ created_at              │
 └────────────────────────┘ └─────────────────────────┘

Both child tables stand in a one-to-many relationship with users and use
ON DELETE CASCADE, so deleting a user automatically removes all of their
refresh tokens and favorite cities (this is exactly what the "Delete
account" feature does).


--------------------------------------------------------------------------------
Tables
--------------------------------------------------------------------------------

users
    One row per registered account. Stores the unique nickname
    (auto-generated at registration), the chosen avatar index, the
    bcrypt-hashed password, and the creation timestamp.

refresh_tokens
    One row per active session for a user. Each row contains a SHA-256
    hash of a refresh token (the raw token only lives in the user’s
    HttpOnly cookie) and the token’s expiry. Used to issue new
    short-lived access JWTs without re-asking for the password. Tokens
    are rotated on every refresh: the old row is deleted and a new one
    inserted. Expired tokens are pruned on login; all tokens for the
    user are deleted on logout, password change, and account deletion.

favorite_cities
    One row per city saved by a user. Stores the city name, the two-letter
    ISO country code (nullable, because reverse-geocoded coordinates are
    not always inside a country polygon), and the geographic coordinates.
    The application enforces a per-user cap of 10 cities.


--------------------------------------------------------------------------------
Fields
--------------------------------------------------------------------------------

users

    id              UUID, primary key. Generated in Python on insert
                    (UUID v4). Surfaced as a string in the application code.
    nickname        VARCHAR(64), unique, NOT NULL. Login identifier.
                    Auto-generated by the server on registration; uniqueness
                    is retried up to 10 times in case of collision.
    avatar_id       INTEGER, NOT NULL. Index into a small set of avatars
                    defined on the frontend (emoji + color combination).
                    No image is stored in the database.
    password_hash   VARCHAR(128), NOT NULL. Bcrypt hash of the password.
                    Raw passwords are never stored.
    created_at      TIMESTAMP WITH TIME ZONE, NOT NULL, default now().
                    Account-creation time.

refresh_tokens

    id              UUID, primary key.
    user_id         UUID, foreign key to users.id with ON DELETE CASCADE.
                    Indexed (added in migration 0004) to speed up the
                    expired-token pruning and revoke-all-sessions queries.
    token_hash      VARCHAR(64), unique, NOT NULL. SHA-256 hash of the
                    refresh token. The plain token is never stored
                    server-side — it lives only in the wispi_refresh
                    HttpOnly cookie on the client.
    expires_at      TIMESTAMP WITH TIME ZONE, NOT NULL. Token validity
                    end (30 days after issuance).
    created_at      TIMESTAMP WITH TIME ZONE, NOT NULL, default now().

favorite_cities

    id              UUID, primary key.
    user_id         UUID, foreign key to users.id with ON DELETE CASCADE.
    name            VARCHAR(128), NOT NULL. City name as resolved by the
                    OpenWeather geocoder at the moment of saving.
    country         VARCHAR(64), nullable. ISO 3166-1 alpha-2 country code.
                    Nullable because reverse-geocoded coordinates are not
                    always inside a country polygon.
    lat             DOUBLE PRECISION (FLOAT), NOT NULL. Latitude in the
                    range [−90, 90]; the range is validated at the API
                    boundary.
    lon             DOUBLE PRECISION (FLOAT), NOT NULL. Longitude in the
                    range [−180, 180]; validated at the API boundary.
    created_at      TIMESTAMP WITH TIME ZONE, NOT NULL, default now().
                    Used to sort the favorites list in display order.


--------------------------------------------------------------------------------
Keys and relationships
--------------------------------------------------------------------------------

Primary keys
    users.id, refresh_tokens.id, favorite_cities.id — all UUIDs (v4),
    generated in Python on insertion.

Unique constraints (effectively candidate keys)
    users.nickname           — login lookup.
    refresh_tokens.token_hash — token verification on refresh.

Foreign keys (both ON DELETE CASCADE)
    refresh_tokens.user_id   → users.id
    favorite_cities.user_id  → users.id

Other indexes
    refresh_tokens.user_id is indexed (Alembic migration 0004) to make
    expired-token pruning and revoke-all-sessions queries efficient.


--------------------------------------------------------------------------------
Design notes
--------------------------------------------------------------------------------

  * All identifiers are UUIDs, not auto-increment integers. They are
    generated in Python before insert; this lets the API return the new
    row’s ID without an extra round trip and avoids exposing row counts.

  * There is no email field. Wispi deliberately keeps the data footprint
    minimal: a user is identified by an auto-generated nickname plus a
    password.

  * The database stores no air-quality data, no request logs, and no PII
    beyond the nickname and bcrypt hash. This deliberate design shapes the
    entire ER model.

  * Schema evolution is reproducible via Alembic:
        0001 — initial (users, refresh_tokens).
        0002 — add favorite_cities.
        0003 — UUID primary keys.
        0004 — index on refresh_tokens.user_id.


================================================================================
ARCHITECTURE
================================================================================


--------------------------------------------------------------------------------
Application tiers
--------------------------------------------------------------------------------

Wispi follows a four-tier architecture:

  1. CLIENT TIER (browser).
     Single-page React + TypeScript application built with Vite, served as
     static files. Uses Leaflet for the interactive map, Recharts for charts,
     and react-i18next for EN/RU localization.

  2. EDGE TIER (Caddy reverse proxy).
     Serves the built SPA, applies security headers and compression, and
     reverse-proxies all /api/* requests to the backend over a private
     Docker network.

  3. APPLICATION TIER (FastAPI backend).
     Stateless Python service. Authenticates users, persists favorites and
     sessions, proxies tile requests, and acts as an aggregator/normalizer
     in front of the external services.

  4. PERSISTENCE TIER (PostgreSQL).
     Accessed asynchronously via SQLAlchemy. Schema managed by Alembic.

  5. EXTERNAL SERVICES.
     OpenWeather (geocoding, current air quality, history, weather raster
     tiles) and MapTiler (base-map raster tiles). Both are reached only
     by the backend; their API keys never leave the server.

These tiers are orchestrated via docker-compose.yml; the backend, frontend
(as static files), Caddy, and PostgreSQL run as separate containers.


--------------------------------------------------------------------------------
Frontend / backend separation
--------------------------------------------------------------------------------

The split between the two halves of the system is strict.

The FRONTEND is responsible for:
    * rendering,
    * routing,
    * form validation,
    * in-memory access-token storage,
    * language switching,
    * request cancellation (AbortController) when a selection changes,
    * runtime validation of API responses (apiGuards.ts),
    * translation of backend error codes into user-friendly localized
      strings (apiMessages.ts).

The BACKEND is responsible for:
    * all communication with OpenWeather and MapTiler (the API keys never
      leave the server),
    * input validation,
    * rate limiting,
    * request-time budgeting and retries against the upstream,
    * password hashing (bcrypt) and JWT issuance,
    * refresh-token rotation,
    * persistence in PostgreSQL,
    * normalization of every response and error into a uniform JSON shape
      { code, message, request_id }.

The frontend never holds an OpenWeather or MapTiler API key, never talks
to those APIs directly, and never reads or writes the PostgreSQL database
except through HTTP calls to the backend.


--------------------------------------------------------------------------------
Module call tree
--------------------------------------------------------------------------------

  BROWSER
    Page component  (Home / Map / Archive / Favorites / Profile / Auth / Info)
        │
        ▼
    Shared UI components
        (CitySearchBox, CityResultPanel, HistoryPanel, AqiHistoryChart,
         FavoriteButton, MapLayersPanel, LanguageSwitcher, UserMenu, ...)
        │
        ▼
    React hooks
        (useAirHistory, useCurrentAir, useLatLonRequest, useLeafletMap,
         useFavorites, useAuth, useArchiveParams, useLocalizedCityName)
        │
        ▼
    Domain logic (lib/)
        (historyModel, locationSelection, mapOverlay, countryName,
         avatars, siteNav)
        │
        ▼
    React contexts
        (AuthContext, FavoritesContext)
        │
        ▼
    API surface
        (api/api.ts, api/authApi.ts, api/favoritesApi.ts)
        │
        ▼
    Transport / cross-cutting
        (api/apiClient.ts: fetch wrapper, cookies, error normalization;
         api/apiGuards.ts; api/apiError.ts; api/apiMessages.ts)
            │
            │  HTTPS — paths under /api/*
            ▼
  CADDY (edge tier)
        Static-file server for /
        reverse_proxy /api/* → backend:8000
            │
            ▼
  FASTAPI BACKEND
    app.py  (application factory, lifespan, router wiring)
        │
        ▼
    Cross-cutting middleware
        CORSMiddleware
        RequestTimeoutMiddleware
        RequestLoggingMiddleware
        SlowAPI rate limiter (per-endpoint)
        Global exception handlers (http_errors.py)
        │
        ▼
    Routers
        /health                            → health.py
        /geocode, /reverse-geocode         → geocode.py
        /air/current, /air/history         → air.py
        /tiles/ow/..., /tiles/mt/...       → tiles.py
        /auth/...                          → auth.py
        /favorites, /favorites/{id}        → favorites.py
        /admin/...                         → admin.py
        │                  │
        ▼                  ▼
    Dependency layer       Auth layer
        (dependencies.py:    (auth/auth_deps.py: get_current_user, JWT
         AppState,            validation; auth/utils.py: bcrypt,
         ow_service,          JWT issue, refresh-token rotation,
         get_db)              nickname generation)
        │                       │
        ▼                       ▼
    Service layer           Persistence layer
      services/openweather/   db/database.py     (async SQLAlchemy session)
        ow_service.py         db/models.py       (User, RefreshToken,
            │                                     FavoriteCity)
            ▼                 db/schemas.py      (Pydantic DTOs)
        transport.py                  │
        (retries, time budget,        ▼
         429 backoff, errors)    ┌──────────────┐
        tiles_service.py         │  PostgreSQL  │
        errors.py                └──────────────┘
            │
            ▼
        httpx.AsyncClient   (shared, lifespan-managed)
            │
            │  HTTPS
            ▼
   ┌──────────────────┐                       ┌────────────────┐
   │   OpenWeather    │                       │    MapTiler    │
   │  (geocode,       │                       │   (base-map    │
   │   air quality,   │                       │    tiles)      │
   │   weather tiles) │                       │                │
   └──────────────────┘                       └────────────────┘


--------------------------------------------------------------------------------
Main call flows
--------------------------------------------------------------------------------

The notation below uses → for "calls" and ⇄ for a request/response over HTTP.

(1) City search (text)

    CitySearchBox  (component)
      → useEffect + AbortController  (debounced fetch)
        → api.ts :: geocodeCity(q, lang, signal)
          → apiClient :: getJson("/geocode?q=…&lang=…")
            ⇄ Caddy /api/* → backend
              → routes/geocode.py :: geocode()
                → SlowAPI limiter (GEOCODE_LIMIT)
                → ow_service.geocode()
                  → transport.request()
                    ⇄ OpenWeather /geo/1.0/direct
              ← list of GeocodeResult
            ◀ JSON {query, results}
      ← apiGuards.isGeoResult validates each item
      ← dropdown displays the results

(2) Map-click selection (reverse geocoding)

    useLeafletMap onSelect(lat, lon)
      → navigate(buildMapUrl({lat, lon}))    (no name yet)
      → useLocalizedCityName(lat, lon)
        → api.ts :: reverseGeocode(lat, lon, lang)
          → apiClient :: getJson("/reverse-geocode?…")
            ⇄ /api/reverse-geocode
              → routes/geocode.py :: reverse_geocode()
                → in-memory dict cache _reverse_cache
                → (miss) ow_service.reverse_geocode()
                  ⇄ OpenWeather /geo/1.0/reverse
              ← {name, country}
      ← city label and country code rendered

(3) Current AQI on a result panel
    (note: actually history-with-days=1; getAirCurrent is defined but
     not used in the current UI)

    Home / Map / Favorites card
      → useAirHistory(lat, lon, days=1)
        → useLatLonRequest (race-safe wrapper around fetch + AbortController)
          → api.ts :: getAirHistory(lat, lon, 1, undefined, signal)
            → apiClient :: getJson("/air/history?lat=…&lon=…&days=1")
              ⇄ /api/air/history
                → routes/air.py :: air_history()
                  → SlowAPI limiter (AIR_HISTORY_LIMIT)
                  → ow_service.air_history(start_ts, end_ts)
                    → transport.request()  (retry budget, 429 handling)
                      ⇄ OpenWeather /data/2.5/air_pollution/history
                ← AirHistoryResponse
      → lib/historyModel.ts :: buildHistoryModel()
        ← model.latestPanel  (AQI pill + pollutants displayed)

(4) Historical chart on Archive / Map

    HistoryPanel (component)
      → useAirHistory(lat, lon, days, selectedDate)
        → same chain as above, with days ∈ [1…365],
          optional end_unix derived from selectedDate
      → buildHistoryModel(items, selectedDate)
        → chartData  for Recharts
      → AqiHistoryChart renders the interactive chart
      → onPickDay(date) navigates to /archive?date=YYYY-MM-DD&...

(5) Map tile fetching (base map + overlays)

    Leaflet TileLayer  (browser)
      ⇄ GET /api/tiles/mt/{z}/{x}/{y}.png       (base map)
           → routes/tiles.py :: maptiler_tile()
             ⇄ MapTiler  (server-side key)
           ← PNG bytes + Cache-Control + ETag pass-through

      ⇄ GET /api/tiles/ow/{layer}/{z}/{x}/{y}.png   (active overlay)
           → routes/tiles.py :: openweather_tile()
             → ow_service.get_tile()
               → OpenWeatherTileService
                 ⇄ OpenWeather /map/2.0/...
           ← PNG bytes + cache headers

(6) Authentication — registration

    Auth page → AuthContext.register(password)
      → authApi :: register(password)
        → apiClient :: postJson("/auth/register", {password})
          ⇄ /api/auth/register
            → routes/auth.py :: register()
              → auth/utils.py :: hash_password()   (bcrypt)
              → generate_nickname() + random_avatar_id()
              → INSERT INTO users
              → _issue_refresh_token():
                  create_refresh_token() + SHA-256 hash
                  INSERT INTO refresh_tokens
                  Set-Cookie wispi_refresh
                    (HttpOnly, SameSite=Lax, 30 days)
              → create_access_token(user_id, nickname, avatar_id)  (JWT)
            ← {access_token, user}
      ← AuthContext stores access token in memory

(7) Add to favorites

    FavoriteButton onClick
      → useFavorites().add(city)
        → FavoritesContext (client-side cap check, optimistic update)
          → favoritesApi :: addFavorite(city, token)
            → apiClient :: postJson("/favorites", body,
                                     {Authorization: Bearer …})
              ⇄ /api/favorites
                → routes/favorites.py :: add_favorite()
                  → Depends(get_current_user)  (JWT-verified)
                  → SELECT ... FOR UPDATE on users row (race-safe count)
                  → COUNT(*) on favorite_cities
                    → if ≥ 10: api_error(400, FAVORITES_LIMIT, …)
                  → INSERT INTO favorite_cities
                ← FavoriteCityOut
      ← FavoritesContext refreshes the list

(8) Error path (unified)

    Any backend exception flows into the handlers in http_errors.py, which
    produce { code, message, request_id }. On the client, apiClient.ts
    reads that body and raises an ApiError; apiMessages.ts maps the code
    to a localized user-facing string via i18n.


================================================================================
MODULES
================================================================================


--------------------------------------------------------------------------------
Frontend modules
--------------------------------------------------------------------------------

Application shell
    Location: aq_frontend/src/App.tsx
    Configures routing, lazy-loads page components, mounts the global
    header / nav / footer, and wraps the tree in AuthProvider and
    FavoritesProvider so authentication and favorites state are available
    everywhere.

Page modules
    Location: aq_frontend/src/pages/
    One component per top-level route: Home, Map, Archive, Favorites
    (protected), Profile (protected), Auth, UsefulInfo, Terms. Each page
    composes shared UI components and hooks; no page contains its own
    HTTP code.

City search component
    Location: aq_frontend/src/components/shared/CitySearchBox.tsx
    Debounced text input that calls geocodeCity() and renders a dropdown
    of matches with name, country code, and optional sub-national state.
    Used by Home, Map, and Archive.

City result panel
    Location: aq_frontend/src/components/shared/CityResultPanel.tsx
    Shows the AQI pill plus pollutant table for one location; receives
    a "panel" view-model from historyModel.

History panel and chart
    Location: aq_frontend/src/components/shared/HistoryPanel.tsx,
              aq_frontend/src/components/shared/AqiHistoryChart.tsx,
              aq_frontend/src/components/shared/AqiHistoryChartControls.tsx
    Renders period presets and the custom range (up to 365 days),
    the AQI-over-time chart (Recharts), and the click-to-pick-day
    interaction on the Archive page.

Favorites button and list
    Location: aq_frontend/src/components/shared/FavoriteButton.tsx,
              aq_frontend/src/pages/Favorites.tsx
    Toggles the active city in the user’s favorites; the favorites page
    renders one card per saved city with its own current AQI fetched on
    load.

Leaflet map module
    Location: aq_frontend/src/hooks/useLeafletMap.ts,
              aq_frontend/src/pages/Map.tsx
    Initializes the Leaflet map, attaches the MapTiler base layer (via
    the backend tile proxy), swaps in OpenWeather overlay layers on user
    toggle, and emits map-click coordinates for selection.

Map overlay registry
    Location: aq_frontend/src/lib/mapOverlay.ts,
              aq_frontend/src/components/map/MapLayersPanel.tsx
    Lists the five OpenWeather overlay layers and produces the tile-URL
    template that Leaflet consumes.

History view-model
    Location: aq_frontend/src/lib/historyModel.ts
    Pure-TS utility that turns a raw AirHistoryResponse into chart data,
    a "latest panel" view-model, and a "selected day panel" view-model.
    Single source of truth for UI shape.

Air-history hook
    Location: aq_frontend/src/hooks/useAirHistory.ts
    React hook that, given lat / lon / days, performs a race-safe fetch
    via useLatLonRequest, then memoizes the resulting view-model. Used
    everywhere the AQI is shown — including for the "current" display,
    where days = 1.

Race-safe request hooks
    Location: aq_frontend/src/hooks/useLatLonRequest.ts,
              aq_frontend/src/hooks/useLatestRequest.ts
    Cross-cutting hooks that abort superseded requests via
    AbortController so stale responses can never overwrite fresh state.

Auth context and hook
    Location: aq_frontend/src/contexts/AuthContext.tsx,
              aq_frontend/src/hooks/useAuth.ts
    Stores the access token in memory, exposes signIn / register /
    signOut / getToken, refreshes the access token silently via
    /auth/refresh, and gates protected routes.

Favorites context
    Location: aq_frontend/src/contexts/FavoritesContext.tsx
    Single source of truth for the user’s favorites: loads /favorites
    once on login, exposes add / remove, enforces the client-side
    mirror of MAX_FAVORITES = 10.

Protected route
    Location: aq_frontend/src/components/shared/ProtectedRoute.tsx
    Redirects unauthenticated users away from /profile and /favorites.

API surface modules
    Location: aq_frontend/src/api/api.ts,
              aq_frontend/src/api/authApi.ts,
              aq_frontend/src/api/favoritesApi.ts
    Strongly typed wrappers around each backend endpoint. Validate every
    response with runtime type guards before returning, so the rest of
    the application can rely on the TypeScript types.

HTTP transport
    Location: aq_frontend/src/api/apiClient.ts
    The single fetch() wrapper. Adds JSON headers and
    credentials: "include" (so the refresh cookie travels), parses
    error envelopes into ApiError, surfaces request-IDs from
    X-Request-Id, and distinguishes network / abort / HTTP / invalid-JSON
    failures.

Error model and messages
    Location: aq_frontend/src/api/apiError.ts,
              aq_frontend/src/api/apiMessages.ts,
              aq_frontend/src/api/apiGuards.ts
    ApiError carries (message, status, code, requestId); apiMessages maps
    server codes to translation keys; apiGuards validates that runtime
    payloads match the TypeScript types.

Localization
    Location: aq_frontend/src/i18n.ts,
              aq_frontend/src/locales/en/translation.json,
              aq_frontend/src/locales/ru/translation.json,
              aq_frontend/src/components/shared/LanguageSwitcher.tsx,
              aq_frontend/src/lib/countryName.ts
    Configures react-i18next, ships EN and RU translations, lets the
    user switch language, and resolves country-code → localized country
    name via Intl.DisplayNames.

Navigation utilities
    Location: aq_frontend/src/lib/locationSelection.ts,
              aq_frontend/src/lib/siteNav.ts,
              aq_frontend/src/components/shared/Header.tsx,
              aq_frontend/src/components/shared/NavBar.tsx
    Encodes / decodes the {lat, lon, name, country} query string used to
    pass a selection between pages; provides scroll-to-anchor behavior
    on the home page.


--------------------------------------------------------------------------------
Backend modules
--------------------------------------------------------------------------------

Application factory
    Location: aq_backend/app.py
    Builds the FastAPI app: registers middleware, exception handlers,
    routers; manages a single shared httpx.AsyncClient for the whole
    process via the lifespan context; constructs OpenWeatherService and
    stores it on app.state for dependency injection.

Configuration
    Location: aq_backend/config.py
    Loads typed settings from environment variables (API keys, upstream
    URLs, timeouts, JWT secret, CORS origins, environment name); cached
    so dependencies receive the same instance.

Geocoding routes
    Location: aq_backend/routes/geocode.py
    Implements GET /geocode (city search) and GET /reverse-geocode
    (coordinate → city name). Performs language-aware name selection
    from OpenWeather’s local_names; reverse-geocoding results are
    memoized in an in-process dictionary.

Air-quality routes
    Location: aq_backend/routes/air.py
    Implements GET /air/current and GET /air/history; validates lat / lon
    and a days ≤ 365 window with optional end_unix anchor; extracts AQI
    and pollutants from the upstream payload defensively (drops
    non-floats, requires AQI in [1, 5]).

Tile proxy routes
    Location: aq_backend/routes/tiles.py
    Implements GET /tiles/ow/{layer}/{z}/{x}/{y}.png (OpenWeather raster
    overlays) and GET /tiles/mt/{z}/{x}/{y}.png (MapTiler base). Validates
    tile coordinates against the zoom level, forwards conditional-request
    headers (If-None-Match, If-Modified-Since), and sets
    Cache-Control: public, max-age=3600. Hides upstream API keys.

Authentication routes
    Location: aq_backend/routes/auth.py
    Implements register / login / refresh / logout / me / change-password
    / delete-me. Issues short-lived JWT access tokens and rotating,
    SHA-256-hashed refresh tokens stored as wispi_refresh HttpOnly
    cookies (SameSite=Lax, 30 days).

Favorites routes
    Location: aq_backend/routes/favorites.py
    list / add / delete saved cities for the authenticated user. Enforces
    MAX_FAVORITES = 10 using a SELECT ... FOR UPDATE on the user row to
    prevent race conditions when adding from multiple tabs.

Health and admin routes
    Location: aq_backend/routes/health.py,
              aq_backend/routes/admin.py
    /health for uptime checks; admin endpoints for internal use.

Auth utilities
    Location: aq_backend/auth/utils.py,
              aq_backend/auth/auth_deps.py
    Bcrypt password hashing and verification, JWT issuance and decoding,
    refresh-token generation and SHA-256 hashing, random nickname
    generation, random avatar selection, and the get_current_user
    FastAPI dependency.

OpenWeather service
    Location: aq_backend/services/openweather/ow_service.py
    Single entry point for all OpenWeather calls (geocode,
    reverse-geocode, current air, history). Hides the API key, builds
    query parameters, and returns parsed JSON together with upstream
    metadata (attempt count, total milliseconds, last status).

OpenWeather transport
    Location: aq_backend/services/openweather/transport.py,
              aq_backend/services/openweather/retry.py,
              aq_backend/services/openweather/errors.py
    Wraps httpx.AsyncClient with a per-call total time budget, bounded
    retries, exponential backoff that respects Retry-After, and typed
    exceptions (OpenWeatherTimeout, OpenWeatherNetworkError,
    OpenWeatherUpstreamError).

Tile service
    Location: aq_backend/services/openweather/tiles_service.py
    Specialized binary-response transport for raster tiles, with
    conditional-header pass-through (ETag, Last-Modified) so that the
    browser cache and the upstream cache cooperate.

Database session
    Location: aq_backend/db/database.py
    Creates the async SQLAlchemy engine and session factory; provides
    the get_db dependency used by every persistence-touching route.

ORM models
    Location: aq_backend/db/models.py
    Declares the three tables (User, RefreshToken, FavoriteCity), their
    relationships, and cascade rules.

Pydantic schemas
    Location: aq_backend/db/schemas.py
    Typed request and response DTOs (GeocodeResult, AirCurrentResponse,
    AirHistoryResponse, FavoriteCityOut, UserOut, …). Validates lat / lon
    ranges and AQI bounds at the API boundary.

Database migrations
    Location: aq_backend/migrations/
    Alembic migrations (0001 initial → 0004 index on
    refresh_tokens.user_id). The schema is reproducible from scratch via
    alembic upgrade head.

Rate limiting
    Location: aq_backend/ratelimit.py
    Configures SlowAPI; defines per-endpoint limits AUTH_LIMIT,
    GEOCODE_LIMIT, AIR_CURRENT_LIMIT, AIR_HISTORY_LIMIT, TILE_LIMIT,
    FAVORITES_LIMIT. Mounted on the FastAPI app and applied to each route
    via a decorator.

Request middleware
    Location: aq_backend/middleware/request_logging.py,
              aq_backend/middleware/timeout.py
    Generates and propagates an X-Request-Id, structured-logs every
    request with timing and upstream metadata, and enforces a hard
    request timeout (RequestTimeoutMiddleware) so a stuck upstream cannot
    pin a worker.

Error handling
    Location: aq_backend/http_errors.py
    Translates internal exceptions (upstream timeouts, upstream 5xx,
    upstream 429, validation errors, generic HTTP exceptions, unhandled
    errors) into a single response envelope { code, message, request_id }.
    Maps upstream 401 / 403 (which would mean a misconfigured API key) to
    a generic 500 so that misconfiguration never leaks to clients.

Dependencies
    Location: aq_backend/dependencies.py
    FastAPI dependency providers: AppState (shared httpx client +
    service), ow_service, get_app_state. Keeps routes pure functions of
    their inputs.

Logging configuration
    Location: aq_backend/log_config.py
    Configures structured JSON logging used by the middleware and
    exception handlers.


--------------------------------------------------------------------------------
Infrastructure modules
--------------------------------------------------------------------------------

Edge / reverse proxy
    Location: Caddyfile
    Caddy serves the built SPA, sets HSTS, X-Content-Type-Options,
    X-Frame-Options, and Referrer-Policy security headers, applies
    zstd + gzip compression, and reverse-proxies /api/* to the backend
    container.

Container orchestration
    Location: docker-compose.yml, docker-compose.dev.yml, Dockerfile.backend,
              Dockerfile.web
    Defines four long-lived services — PostgreSQL (`db`), backend (FastAPI),
    and `web` (Caddy + the built static SPA in a single container) — plus a
    one-shot `migrate` service that runs Alembic migrations to completion
    before backend startup. The local-development override
    `docker-compose.dev.yml` builds the backend image from source, exposes
    port 8000, and disables the `web` service so the Caddy production
    domain is not invoked.
