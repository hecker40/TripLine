# TravelOS

**Generate → Break → Observe → Recover → Approve.**

A working hackathon application with a real LLM planner, optional **TrueForge harness**, map/timeline, streamed AgentOps, constraint checks, bounded repair, model fallback, execution budgets, controlled tools, and demonstration approvals.

## Jeffrey: deploy from GitHub to Vercel

1. Import `hecker40/TripLine` with the **Vite** preset. The included `vercel.json` builds the frontend and deploys the root `api/` server functions. Use Node 22.14+ and Fluid Compute (the runtime function allows up to 300 seconds).
2. In **Settings → Environment Variables**, set `TRAVELOS_OPENAI_API_KEY` to the **full working site key**, for Production and any Preview environment you use. It belongs in Vercel, not Git. A local `.env.local` does not transfer on a Git push.
3. Set `TRAVELOS_OPENAI_MODEL=gpt-4o-mini`. For a deployment without a hosted TrueForge server, set `TRAVELOS_ENGINE=openai` (the default). The interface honestly identifies direct mode.
4. Redeploy after setting/changing variables. Open the latest project domain, not an old immutable preview URL.
Vercel builds fail early with an actionable message if the key/harness check fails, instead of publishing a planner that cannot authenticate.

5. Use **Verify connection** in the application. `GET /api/runtime?verify=1` reports key/model readiness without returning credentials. Then generate a trip. `HOST` and `PORT` are not needed on Vercel.

### TrueForge on the deployed application

TrueForge is a **separate long-running server**, not a Vercel serverless function. Host it using [TrueForge's hosted instructions](https://trueforge.dev/quickstart), configure its OpenAI provider, and set on Vercel:

```env
TRAVELOS_ENGINE=trueforge
TRUEFORGE_BASE_URL=https://your-harness.example.com
TRUEFORGE_TOKEN=your_oidc_id_token_if_required
```

The official `@truefoundry/trueforge-sdk` creates actual sessions, supplies the structured JSON schema, consumes turn events, and validates completion. A configured but unavailable harness errors explicitly; it is never silently labelled connected. In the harness, configure model aliases `gpt-4o-mini` and `gpt-4-1-mini` (upstream IDs `gpt-4o-mini` and `gpt-4.1-mini`).

## Run locally

```sh
npm ci
cp .env.example .env.local   # only on a new checkout; do not overwrite an existing key
# Set TRAVELOS_OPENAI_API_KEY in .env.local using an editor.
npm run check:llm
npm run dev
```

Open http://localhost:5173. The local API runs on 127.0.0.1:8787. For a built local server: `npm run build && npm start`.

### Local TrueForge demo

In terminal 1:

```sh
npm run harness
```

In terminal 2 (with the working site key in `.env.local`):

```sh
npm run harness:setup
```

The setup command configures the local harness provider without printing the key. Add to `.env.local` and restart `npm run dev`:

```env
TRAVELOS_ENGINE=trueforge
TRUEFORGE_BASE_URL=http://127.0.0.1:8790
```

The TrueForge standalone server is for **localhost only**. Use its hosted mode for shared deployment. Hosted OIDC tokens must be renewed as required by your identity provider. The local setup script refuses remote credential provisioning unless explicitly enabled.

## Demo script

1. Generate Tokyo, 4 days, 2 travelers, $1,500; interests food/culture/technology; wake-up 09:00.
2. Inspect the map, daily timeline, two budgets, evaluations, and live AgentOps trace.
3. In **Chaos lab**, inject a **hotel price spike**. The simulated price is raised enough to cross the budget; the planner proposes an alternative for the affected stay and preserves other activities.
4. Inject **restaurant closure**; only that activity changes. Inspect the revision history and explanation.
5. Inject **route timeout**: three failed attempts with two backoffs, then previously computed route estimates are recovered. If no cached coordinates existed, that is reported rather than fabricated.
6. Inject **unauthorized cancellation**: capability check blocks it. Inject **booking approval** and approve/deny. These are demonstration requests; no reservation or payment adapter exists.
7. Inject **model failure** to exercise the actual alternate-model call. **Budget reduction** triggers broader repair; **rain** proposes one indoor replacement.

## Architecture

```text
React workspace + Leaflet map + AgentOps
  → /api/runtime (streamed NDJSON; same handler locally and on Vercel)
    → signed trip state + policy and execution budget checks
    → Research tools (live city geocoding / weather when available)
    → Planner (OpenAI or official TrueForge SDK)
    → deterministic structural / budget / wake-up checks
    → bounded repair + LLM preference critic
    → signed result / targeted chaos recovery / approval state
```

- `shared/`: preferences, itinerary and runtime contracts.
- `server/runtime/`: engine, model routing/cost reservation, TrueForge adapter, tools, evaluation, signed state, readiness.
- `server/routes/`: HTTP transport and read-only MCP endpoint.
- `api/`: Vercel Functions. Legacy `/api/trips/generate` remains available for compatibility.
- `src/runtime/`: streamed state, real map, AgentOps. `src/App.tsx` is the rebuilt workspace.
- `scripts/`: safe connection checks and local TrueForge setup.
- `tests/`: contract, API, runtime, provider and responsive browser coverage. Mock providers exist only in tests.

### MCP

`POST /api/mcp` is a stateless JSON-RPC MCP endpoint supporting initialize, tools/list and tools/call. It exposes only `places.search` (Open-Meteo city geocoding) and `routes.estimate` (explicitly approximate geometry). No arbitrary URLs, shell, payment or cancellation tools. Set `TRAVELOS_MCP_TOKEN` to require a bearer token for this endpoint. It can be added to TrueForge's connector settings; travel orchestration also uses the same controlled tool implementations directly.

### Environment

| Variable | Purpose |
| --- | --- |
| `TRAVELOS_OPENAI_API_KEY` | Required server-side site key. Never read from browser or committed source. |
| `TRAVELOS_OPENAI_MODEL` | Default `gpt-4o-mini`. |
| `TRAVELOS_REASONING_MODEL` | Repair model; default `gpt-4.1-mini`. |
| `TRAVELOS_FALLBACK_MODEL` | Alternate model; default `gpt-4.1-mini`. |
| `TRAVELOS_ENGINE` | `openai` or `trueforge`. |
| `TRUEFORGE_BASE_URL`, `TRUEFORGE_TOKEN` | Your running harness URL and optional OIDC token. |
| `TRAVELOS_STATE_SECRET` | Optional separate signing secret. Defaults to deriving signatures from the site key. Rotation invalidates old trip sessions. |
| `TRAVELOS_MCP_TOKEN` | Optional bearer token for the read-only MCP endpoint. |
| `HOST`, `PORT` | Local/self-hosted only; defaults 127.0.0.1:8787. |

Model tariffs are explicit in `server/runtime/models.ts` (OpenAI published input/output rates). Unknown model prices are rejected. Cost figures are **estimates**, not invoices. Direct OpenAI records actual response token usage; TrueForge currently charges a conservative pre-call reservation when usage is unavailable. No secret, provider response body or raw key appears in the trace.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
PLAYWRIGHT_CHROME=1 npm run test:e2e  # uses installed Google Chrome
npm run check:llm                   # verifies configured key/model, no key output
```

## Honest boundaries

- A hackathon reference implementation, **not a production booking service**. Venue suggestions, prices, walking estimates and map coordinates remain proposals; real hours, availability and dietary suitability are unknown, never marked verified.
- Selected-day map previews use OSRM walking/driving geometry and estimated durations. Missing coordinates are resolved through Photon and labelled search matches, not verified venues. Transit links open Google Maps; TravelOS does not fetch live train schedules. Route previews do not alter the planner or evaluator. Open-Meteo still supplies city/forecast research.
- Trips are 1–7 inclusive days, USD for the entire party, flights excluded. Activity costs are model estimates; arithmetic totals are calculated by the server. Unknown coordinates remain null.
- All chaos events are labelled simulations. Recovery logic and LLM calls are real. Approvals never execute money movements or bookings.
- Session state is signed, expires after 24h, and travels with the browser so Vercel instances need no in-memory session store. This is not a multi-user durable database or replay-resistant global spend ledger. Add authenticated durable storage, idempotency and account-level rate/spend limits before shared production use. Keep the deployment access-controlled during the hackathon.
- Changes affect only the selected activity where possible. A global budget change can affect the whole trip. Repair is bounded; infeasible constraints surface as needs-attention, not endless retries.
- Preferences can be explicitly remembered on the current device. No hidden cross-user memory, no continuous background monitoring. Forecast triggers are manual chaos simulations, not unattended automation.


## Day maps, disruptions and live agent progress

- Select a day to see only its stops, scheduled local times and route legs. Select a map marker or timeline activity to highlight the same stop. Walking/driving previews include estimated leg durations and flag gaps that are too short. Transit directions open Google Maps separately.
- `POST /api/maps` accepts the signed trip envelope, `date` and `mode` (`walking`/`driving`). It maps only that day, excludes transportation placeholders as destinations, and never bridges missing stops. Provider errors preserve the itinerary; no route is invented. Client caches are keyed by trip/version/day/mode; server lookups are cached and coalesced.
- Route paths use [OSRM/FOSSGIS](https://routing.openstreetmap.de/about.html); missing locations use [Photon](https://github.com/komoot/photon). Public servers are low-volume demo services, with no availability guarantee. Requests are queued at most once per 1.1 seconds per server process. For a multi-instance or busy deployment, set your own `TRAVELOS_GEOCODER_URL` (Photon `/api/`), `TRAVELOS_WALK_ROUTER_URL` and `TRAVELOS_DRIVE_ROUTER_URL` (OSRM profile roots). A per-process queue is **not** an application-wide distributed rate limiter. Only location queries/coordinates go to these map providers—not API keys or trip notes.
- In **Adjust this day**, describe a missed train/reservation and set **Resume planning at** in destination-local time. `action: adapt` invokes the separate `AdapterAgent` through the existing budget-controlled model provider/TrueForge. It changes only unfinished activities on the selected date; completed activities and every other day are structurally preserved. The existing evaluator runs on the result. Invalid, overlapping, backdated or no-op repairs are rejected without replacing the previous plan. No bookings, refunds or cancellations occur.
- The visible **Agent progress** panel follows actual streamed events for Research, Planner, Adapter, Critic, Policy and Runtime. It resets for each operation, shows unused agents honestly and exposes event detail. Existing agents, routing and generation ordering are unchanged.
