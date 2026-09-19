import { z } from "zod";
import type { DayMap, RouteMode } from "../../shared/maps";
import type { TripRun } from "../../shared/runtime";
import { AppError } from "../errors";

const lonLat = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);
const photonSchema = z.object({
  features: z.array(
    z.object({
      geometry: z.object({ coordinates: lonLat }),
      properties: z
        .object({ name: z.string().optional(), city: z.string().optional() })
        .passthrough(),
    }),
  ),
});
const osrmSchema = z.object({
  code: z.literal("Ok"),
  routes: z
    .array(
      z.object({
        legs: z.array(
          z.object({
            distance: z.number().nonnegative(),
            duration: z.number().nonnegative(),
            steps: z.array(
              z.object({
                geometry: z.object({ coordinates: z.array(lonLat) }),
              }),
            ),
          }),
        ),
      }),
    )
    .min(1),
});

// Shared queue, bounded cache and request coalescing protect the public demo services.
// Multi-instance production must use its own routing/geocoding service.
const cache = new Map<string, { expires: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();
let queue = Promise.resolve();
let nextRequestAt = 0;
async function publicJson(url: URL): Promise<unknown> {
  const key = url.toString();
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  if (pending.has(key)) return pending.get(key)!;
  if (pending.size >= 24) throw new Error("Map service busy");
  const task = queue.then(async () => {
    await new Promise((r) =>
      setTimeout(r, Math.max(0, nextRequestAt - Date.now())),
    );
    nextRequestAt = Date.now() + 1100;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "TravelOS/1.0 (https://github.com/hecker40/TripLine)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Map service unavailable");
    const raw: unknown = await response.json();
    const value = url.pathname.includes("/route/")
      ? osrmSchema.parse(raw)
      : photonSchema.parse(raw);
    if (cache.size >= 512) cache.delete(cache.keys().next().value!);
    cache.set(key, { value, expires: Date.now() + 86_400_000 });
    return value;
  });
  queue = task.then(
    () => {},
    () => {},
  );
  pending.set(key, task);
  try {
    return await task;
  } finally {
    pending.delete(key);
  }
}

export async function buildDayMap(
  run: TripRun,
  date: string,
  mode: RouteMode,
  getJson: (url: URL) => Promise<unknown> = publicJson,
): Promise<DayMap> {
  const day = run.itinerary.days.find((d) => d.date === date);
  if (!day)
    throw new AppError("INVALID_DAY", "Choose a day in this trip.", 400);
  // Transit activities describe a journey, not a distinct destination to route through.
  const activities = day.activities.filter(
    (a) => a.category !== "transportation",
  );
  const result: DayMap = { date, mode, stops: [], legs: [], warnings: [] };
  const deadline = Date.now() + 30_000;
  for (const activity of activities) {
    const { latitude, longitude } = activity.location;
    const stop: DayMap["stops"][number] = {
      id: activity.id,
      coordinates:
        latitude !== null && longitude !== null ? [latitude, longitude] : null,
      source:
        latitude !== null && longitude !== null ? "planner" : "unavailable",
      matchedName: null,
    };
    if (!stop.coordinates && Date.now() < deadline) {
      try {
        const url = new URL(
          process.env.TRAVELOS_GEOCODER_URL || "https://photon.komoot.io/api/",
        );
        url.searchParams.set(
          "q",
          `${activity.location.name}, ${run.preferences.destination}`,
        );
        url.searchParams.set("limit", "1");
        if (run.research) {
          url.searchParams.set("lat", String(run.research.latitude));
          url.searchParams.set("lon", String(run.research.longitude));
        }
        const match = photonSchema.parse(await getJson(url)).features[0];
        if (match) {
          const [lon, lat] = match.geometry.coordinates;
          // Do not accept a same-named venue in a different region.
          if (
            !run.research ||
            (Math.abs(lat - run.research.latitude) < 1 &&
              Math.abs(lon - run.research.longitude) < 1)
          ) {
            stop.coordinates = [lat, lon];
            stop.source = "Photon match";
            stop.matchedName = [match.properties.name, match.properties.city]
              .filter(Boolean)
              .join(", ");
          }
        }
      } catch {
        /* An unresolved stop stays explicitly unmapped. */
      }
    }
    result.stops.push(stop);
  }
  const mapped = result.stops.filter((s) => s.coordinates !== null);
  if (mapped.length < result.stops.length)
    result.warnings.push(
      "Some locations could not be mapped. No route is drawn across an unmapped stop; use its Google Maps search link.",
    );
  if (mapped.length > 1) {
    try {
      const base =
        mode === "walking"
          ? process.env.TRAVELOS_WALK_ROUTER_URL ||
            "https://routing.openstreetmap.de/routed-foot"
          : process.env.TRAVELOS_DRIVE_ROUTER_URL ||
            "https://routing.openstreetmap.de/routed-car";
      const coords = mapped
        .map((s) => `${s.coordinates![1]},${s.coordinates![0]}`)
        .join(";");
      const url = new URL(
        `${base.replace(/\/$/, "")}/route/v1/driving/${coords}`,
      );
      url.search = new URLSearchParams({
        overview: "false",
        geometries: "geojson",
        steps: "true",
        generate_hints: "false",
      }).toString();
      const route = osrmSchema.parse(await getJson(url)).routes[0];
      if (route.legs.length !== mapped.length - 1)
        throw new Error("Incomplete route");
      route.legs.forEach((leg, index) => {
        const from = mapped[index],
          to = mapped[index + 1];
        if (result.stops.indexOf(to) !== result.stops.indexOf(from) + 1) return;
        const coordinates = leg.steps.flatMap((s) =>
          s.geometry.coordinates.map(([lon, lat]): [number, number] => [
            lat,
            lon,
          ]),
        );
        if (coordinates.length < 2) return;
        result.legs.push({
          from: from.id,
          to: to.id,
          coordinates,
          distanceKm: leg.distance / 1000,
          minutes: Math.ceil(leg.duration / 60),
        });
      });
    } catch {
      result.warnings.push(
        "Route service unavailable for this day. Stops and scheduled times remain available; no navigation path was fabricated.",
      );
    }
  }
  result.warnings.push(
    "Routes use proposed or search-matched locations. Confirm the venue match. Durations are estimates, not live traffic or train schedules.",
  );
  return result;
}
