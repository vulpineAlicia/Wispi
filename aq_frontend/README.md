# Wispi — Frontend

A web app for tracking and visualizing air quality worldwide.

## Features

- City AQI lookup: search any city and get clear air quality metrics
- Health impact: recommendations based on current air quality level
- Interactive map: inspect conditions by location with map overlays
- Archive: access historical air quality data
- FAQ: educational content about air quality
- Auth: register, login, change password, and delete account
- Profile: manage account settings

## Tech Stack

- React 19, TypeScript, Vite
- Tailwind CSS
- Leaflet (maps), Recharts (charts)
- Redux Toolkit

## Getting Started

### Requirements

- Node.js 22
- A [MapTiler](https://www.maptiler.com/) account for map tiles
- The Wispi backend running (see `../aq_backend/README.md`)

### Setup

Run from `aq_frontend/`:

```bash
cp .env.example .env
# Fill in the required variables in .env
npm ci
npm run dev
```

## Environment Variables

All `VITE_` variables are bundled into the client at build time and are **not secret**.

| Variable             | Description                                           | Required |
|----------------------|-------------------------------------------------------|----------|
| `VITE_MAPTILER_KEY`  | MapTiler API key — restrict by domain in your account | Yes      |
| `VITE_API_BASE`      | Backend base URL (e.g. `http://127.0.0.1:8000`)       | Yes      |
| `VITE_CONTACT_EMAIL` | Contact email displayed in the UI                     | No       |
| `VITE_REPO_URL`      | GitHub repo link displayed in the UI                  | No       |

## Project Structure

```
src/
├── pages/              # Top-level route pages
│   ├── Home.tsx
│   ├── Map.tsx
│   ├── Archive.tsx
│   ├── UsefulInfo.tsx
│   ├── Auth.tsx
│   └── Profile.tsx
├── components/         # UI components grouped by feature
│   ├── shared/         # NavBar, Footer, Header, search, shared panels
│   ├── templates/      # Base primitives (BaseButton, Bubble)
│   ├── home/           # Home page components
│   ├── map/            # Map page components
│   ├── archive/        # Archive page components
│   └── info/           # Info/FAQ components
├── hooks/              # Custom React hooks (data fetching, map, routing)
├── lib/                # Utilities and services
│   └── services/       # API client, auth API, types, error handling
├── assets/             # Static assets
├── App.tsx             # App shell with routing
└── main.tsx            # Entry point
```
