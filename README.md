# Wispi

A web app for tracking and visualizing air quality worldwide, deployed at <https://wispi.monster>.

It consists of a FastAPI backend ([`aq_backend/`](aq_backend/)) backed by PostgreSQL, a React + TypeScript SPA ([`aq_frontend/`](aq_frontend/)), and a Caddy edge container that serves the SPA and reverse-proxies `/api/*` to the backend. The OpenWeather and MapTiler API keys are loaded only by the backend; they never reach the browser.

## Running in production

The production deployment uses prebuilt images published to GitHub Container Registry.

1. Copy [`aq_backend/.env.example`](aq_backend/.env.example) to `aq_backend/.env` and fill in every required variable (OpenWeather + MapTiler keys, JWT/admin secrets ≥ 32 chars, Postgres credentials, frontend origins, etc.).
2. Make sure your DNS for `wispi.monster` points at the host (Caddy auto-provisions a TLS certificate on startup; see [`Caddyfile`](Caddyfile) to change the domain).
3. From the project root:

   ```bash
   docker compose pull
   docker compose up -d
   ```

   This starts Postgres, runs Alembic migrations via the one-shot `migrate` service, then brings up the backend and the Caddy/static-frontend container.

To deploy a code change, push the relevant branch — the CI pipeline rebuilds and republishes the `wispi-backend` / `wispi-web` images. Then on the host: `docker compose pull && docker compose up -d`.

## Running locally

The production compose file pulls published images and points Caddy at the production domain, so it's not suited for local iteration. For local development (building from source, no Caddy/TLS), see:

- [`docs/backend.md`](docs/backend.md) — full backend setup (bare-metal **and** Docker Compose local override)
- [`docs/frontend.md`](docs/frontend.md) — frontend dev server, end-to-end local stack
- [`docs/api_guide.md`](docs/api_guide.md) — every public API endpoint with runnable curl examples
- [`docs/system_description.md`](docs/system_description.md) — architecture, ER model, module call tree
