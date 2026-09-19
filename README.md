# TravelOS

Milestone 1: preferences → Planner Agent → validated itinerary → inspect / regenerate.
Built on the repository's existing React + Vite frontend and lightweight Node HTTP server.
The former template generator, external map loading, and conversational edits have been
replaced by a single real AI planning flow. The earlier prototype remains in Git history.

## Run

Requires Node **22.12+** and npm.

```sh
npm ci
cp .env.example .env.local
# Set TRAVELOS_OPENAI_API_KEY in .env.local using your editor.
npm run dev
```

Open the Vite URL printed in the terminal (normally http://localhost:5173).
The backend listens on http://127.0.0.1:8787; Vite proxies `/api` to it.

| Variable | Purpose |
| --- | --- |
| `TRAVELOS_OPENAI_API_KEY` | Required server-side **site** key. No fallback to the host's `OPENAI_API_KEY`. |
| `TRAVELOS_OPENAI_MODEL` | One model supporting Responses structured output; defaults to `gpt-4o-mini`. |
| `PORT` | Node server port; defaults to `8787`. |
| `HOST` | Bind address; defaults to `127.0.0.1`. Use `0.0.0.0` when required by a hosting platform. |

`.env.local` is ignored by Git. Never put credentials in `VITE_*` variables. OpenClaw's
configuration is not read or modified. On a host, configure the same variables as server
environment secrets. The app starts without a key but generation returns a clear 503 error;
there is no runtime mock mode or hidden template fallback.

Production / local build preview:

```sh
npm run build
npm start
```

The Node server serves both `dist/` and the API. No database is required. Trip state is
held in the current browser session and is lost on refresh. Public hosting/access controls
are not part of this milestone; the default server binds only to localhost.

## Boundaries

```text
React form / itinerary UI
  → POST /api/trips/generate
  → TripPreferences validation
  → PlannerAgent
  → AIProvider (OpenAI Responses structured output)
  → ItineraryValidator
  → { itinerary }
```

- `shared/`: Zod contracts, inferred TypeScript types, and structural consistency checks.
- `server/agents/`: planner abstraction and system instructions.
- `server/providers/`: small provider interface and real OpenAI adapter.
- `server/app.ts`: input validation, HTTP routing, safe error envelopes, static frontend.
- `src/components/`: form, itinerary overview, activity cards, and empty/loading states.
- `src/hooks/useTripPlanner.ts`: simple local request state; preserves the last good trip.
- `tests/`: contract/API/SDK tests and desktop/mobile browser tests.

The Planner receives all preferences and makes one structured-output request. Both the
provider's schema output and the application's cross-field contract are validated. There
are no tools, bookings, retries, model routing, or additional agents. SDK retries are
disabled, the provider timeout is 90 seconds, and output is capped at 16,000 tokens.

### Contract decisions

- Trips are **1–7 days**, with both dates included. September 20–23 is four days.
- All costs are **USD for the entire party**. Include lodging, meals, activities, and
  local transport; exclude flights and discretionary shopping. N days means N−1 hotel nights.
- Local activity times use `HH:MM`, finish on the same day, and include duration minutes.
- Unknown location addresses/coordinates are nullable. Nothing is live-verified.
- Request metadata, complete dates, unique activity IDs, chronological times, durations,
  and daily/trip cost sums are checked. These are contract checks, **not** a real-world
  feasibility evaluator. Opening hours, routes, prices, and dietary suitability remain
  proposals. The UI explicitly flags over-budget plans and displays model assumptions.
- Regenerate uses the preferences behind the displayed trip. To use edited form values,
  choose **Generate Trip**. Failure retains both the form and the previous successful trip.

Example request to `POST /api/trips/generate`:

```json
{
  "destination": "Tokyo, Japan",
  "startDate": "2026-09-20",
  "endDate": "2026-09-23",
  "travelers": 2,
  "budget": 1500,
  "interests": ["food", "culture", "technology"],
  "pace": "balanced",
  "transportation": "public_transit",
  "hotelPreference": "mid_range",
  "dietaryRestrictions": [],
  "additionalPreferences": "Nothing before 9 AM."
}
```

Success: `{ "itinerary": { ... } }`. Errors:
`{ "error": { "code": "INVALID_AI_OUTPUT", "message": "..." } }`.
Invalid input uses 400; missing configuration 503; invalid/provider output 502; timeout 504.
Raw provider errors, keys, prompts, and itineraries are not logged.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

If Chrome is already installed, use `PLAYWRIGHT_CHROME=1 npm run test:e2e` instead of
downloading Chromium. Browser tests run the built frontend and real HTTP/API/Planner path
with an explicitly injected **test-only provider**; production never imports the fixture.
SDK tests replace only the network transport, including refusal, malformed JSON, timeout,
and server failure cases. No tests incur OpenAI charges.

A valid site key is still required to verify live model generation: start the normal app,
generate the four-day Tokyo trip, then regenerate. Deterministic tests do not prove live
model access or real-world travel accuracy.

## Later milestones (not implemented)

TrueForge, MCP/tools, specialist agents, real-world evaluators, replanning, routing,
observability, approvals, bookings, persistence, and chaos testing. Add these behind the
existing API/Planner/provider boundaries rather than changing the UI's itinerary contract.
