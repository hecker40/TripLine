# TripLine

TripLine is a React + Vite demo that now includes a lightweight local backend for itinerary generation.

## What changed

- Chat input now calls a backend pipeline to generate a full itinerary
- The left-side cards update with real stop data: name, category, description, rating, pricing, and action links
- The right-side Leaflet map now draws the route trail and highlights each stop
- Clicking a map stop opens a compact booking/details popup

## Run locally

```bash
npm install
npm run dev
```

That starts:

- Vite frontend
- Local itinerary API on `http://localhost:8787`

## Useful scripts

```bash
npm run dev      # frontend + backend together
npm run client   # frontend only
npm run server   # backend only
npm run build    # production frontend build
npm run lint     # oxlint
```

## Backend endpoint

```bash
POST /api/generate-itinerary
Content-Type: application/json

{
  "prompt": "Plan a relaxed 5 day Tokyo trip for 2 adults with coffee, anime, sushi, and culture"
}
```

The backend returns a mapped itinerary payload used directly by the UI.
