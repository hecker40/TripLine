# TripLine

TripLine is a React + Vite travel-planning demo with a lightweight local backend.

## What it does now

- supports a dashboard entry flow with redirect cards and destination quick starts
- generates itinerary pipelines for global destinations, not just Tokyo
- keeps the main split-screen planner UI intact
- updates the left-side cards with stop details, category, rating, price, and action links
- draws the route trail on the map and highlights every stop
- opens compact details and booking-oriented popups on map click
- supports iterative follow-up prompts like cheaper, more romantic, more local, family-friendly, nightlife-heavy, and laptop-friendly

## Run locally

```bash
npm install
npm run dev
```

That starts:

- Vite frontend
- local itinerary API on `http://localhost:8787`

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
  "prompt": "Plan a romantic 4 day trip to Paris for 2 adults with cafes, museums, evening views, and one luxury dinner"
}
```

The backend returns a mapped itinerary payload used directly by the UI.
