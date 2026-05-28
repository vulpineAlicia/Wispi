# Wispi — Frontend

A web app for tracking and visualizing air quality worldwide.

## Features

- City AQI lookup: search any city and get clear air quality metrics
- Health impact: recommendations based on current air quality level
- Interactive map: inspect conditions by location with map overlays
- Archive: access historical air quality data
- Favorites: save cities to your account and revisit them
- FAQ: educational content about air quality
- Auth: register, login, change password, and delete account
- Profile: manage account settings
- Localization: English and Russian, switchable in-app

## Tech Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4
- React Router v7
- Leaflet (maps), Recharts (charts)
- React Context for global state (auth, favorites)
- i18next + react-i18next (localization)
- Vitest + Testing Library (tests)

## Getting Started

### Requirements

- Node.js 22
- The Wispi backend running (see [`backend.md`](./backend.md))

### Setup — full stack via Docker (recommended)

Run from the project root:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

This brings up Postgres, runs Alembic migrations, starts the FastAPI backend, and starts the Vite dev server (with HMR) in its own container. Open `http://localhost:5173`. See the local-development section in [`backend.md`](./backend.md) for the one-time `aq_backend/.env` setup. No `aq_frontend/.env` is required for this flow — the override sets `DEV_API_TARGET` directly, and the frontend proxies `/api/*` to the backend container over the Docker network.

### Setup — bare metal

Run from `aq_frontend/`:

```bash
cp .env.example .env
# Set VITE_API_BASE=http://127.0.0.1:8000 (or leave default and rely on the Vite proxy)
npm ci
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies `/api/*` to `DEV_API_TARGET` (default `http://127.0.0.1:8000`). Requires the backend to be running separately.

Scripts:

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint
- `npm test` — run Vitest

## Environment Variables

`VITE_*` variables are bundled into the client at build time and are **not secret**. `DEV_API_TARGET` is read by `vite.config` and is not exposed to the browser.

| Variable             | Description                                                       | Required |
|----------------------|-------------------------------------------------------------------|----------|
| `VITE_API_BASE`      | Backend base URL (e.g. `http://127.0.0.1:8000`)                   | Yes      |
| `VITE_CONTACT_EMAIL` | Contact email displayed in the footer and profile page            | No       |
| `DEV_API_TARGET`     | Vite dev-server proxy target (default `http://127.0.0.1:8000`)    | No       |

MapTiler tiles are fetched through the backend tile proxy, so no MapTiler key is required in the frontend.

## Project Structure

```
src/
├── pages/              # Top-level route pages
│   ├── Home.tsx
│   ├── Map.tsx
│   ├── Archive.tsx
│   ├── Favorites.tsx
│   ├── UsefulInfo.tsx
│   ├── Auth.tsx
│   ├── Profile.tsx
│   └── Terms.tsx
├── components/         # UI components grouped by feature
│   ├── shared/         # NavBar, Footer, Header, search, language switcher, panels
│   ├── templates/      # Base primitives (BaseButton, Bubble)
│   ├── home/           # Home page components
│   ├── map/            # Map page components
│   ├── archive/        # Archive page components
│   └── info/           # Info/FAQ components
├── contexts/           # React Context providers (AuthContext, FavoritesContext)
├── hooks/              # Custom hooks (data fetching, map, navigation, favorites)
├── api/                # API client, auth/favorites APIs, error handling, types
├── lib/                # Pure utilities (country names, history model, site nav)
├── locales/            # i18next translation bundles (en, ru)
├── i18n.ts             # i18next initialization
├── assets/             # Static assets
├── App.tsx             # App shell with routing
└── main.tsx            # Entry point
```
