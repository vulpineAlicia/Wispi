# Wispi — Frontend
A web app for tracking and visualizing air quality worldwide.

## Features
- City AQI lookup: search any city and get clear air quality metrics
- Health impact: recommendations based on current air quality level
- Interactive map: inspect conditions by location with map overlays
- Archive: access historical air quality data
- FAQ: educational content about air quality

## Tech Stack
- React 19, TypeScript, Vite
- Tailwind CSS
- Leaflet (maps), Recharts (charts)

## Getting Started

### Requirements
- Node.js (LTS recommended)
- A [MapTiler](https://www.maptiler.com/) account for map tiles
- The Wispi backend running (see `../aq_backend/readme`)

### Setup
1. Copy `.env.example` to `.env` and fill in the required variables
2. Install dependencies
3. Start the server

Execute next commands from ../aq_frontend: 
```bash
cp .env.example .env
npm install
npm run dev
```

## Environment Variables
All `VITE_` variables are bundled into the client at build time and are **not secret**.

| Variable             | Description                                           | Required |
|----------------------|-------------------------------------------------------|----------|
| `VITE_MAPTILER_KEY`  | MapTiler API key — restrict by domain in your account | Yes      |
| `VITE_API_BASE`      | Backend base URL                                      | Yes      |
| `VITE_CONTACT_EMAIL` | Contact email displayed in the UI                     | No       |
| `VITE_REPO_URL`      | GitHub repo link displayed in the UI                  | No       |

## Project Structure
```
src/
├── pages/          # Top-level route pages (Home, Map, Archive, UsefulInfo)
├── components/     # UI components grouped by feature
│   ├── shared/     # NavBar, Footer, Header, search, shared panels
│   ├── templates/  # Base primitives (BaseButton, Bubble)
│   ├── home/       # Home page components
│   ├── map/        # Map page components
│   ├── archive/    # Archive page components
│   └── info/       # Info/FAQ components
├── hooks/          # Custom React hooks (data fetching, map, routing)
├── lib/            # Utilities and services
│   └── services/   # API client, types, error handling, type guards
├── assets/         # Static assets
├── App.tsx         # App shell with routing
└── main.tsx        # Entry point
```
