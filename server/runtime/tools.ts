import type { AgentName } from "../../shared/runtime";
import type { Itinerary } from "../../shared/itinerary";
import type { Research, RouteEstimate } from "../../shared/runtime";
import { AppError } from "../errors";

export const permissions: Record<AgentName, readonly string[]> = {
  Runtime: ["routes.estimate", "booking.request"],
  Research: ["places.search", "weather.forecast", "routes.estimate", "booking.search"],
  Planner: ["itinerary.update", "routes.estimate"],
  Critic: ["itinerary.read"],
  Policy: [],
  Adapter: ["itinerary.update", "routes.estimate"],
};
export function assertPermission(agent: AgentName, tool: string) {
  if (!permissions[agent].includes(tool))
    throw new AppError(
      "TOOL_FORBIDDEN",
      `${agent} is not permitted to call ${tool}.`,
      403,
    );
}
export async function researchDestination(
  destination: string,
): Promise<Research | null> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", destination.split(",")[0].trim());
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error("Geocoding unavailable");
  const json: unknown = await response.json();
  if (
    !json ||
    typeof json !== "object" ||
    !("results" in json) ||
    !Array.isArray(json.results)
  )
    return null;
  const first = json.results[0] as Record<string, unknown> | undefined;
  if (
    !first ||
    typeof first.latitude !== "number" ||
    typeof first.longitude !== "number"
  )
    return null;
  return {
    name: String(first.name),
    latitude: first.latitude,
    longitude: first.longitude,
    source: "Open-Meteo geocoding",
    weather: null,
  };
}
export async function researchWeather(
  place: Research,
  startDate: string,
): Promise<string> {
  const daysAway =
    (Date.parse(`${startDate}T00:00:00Z`) - Date.now()) / 86_400_000;
  if (daysAway < -1 || daysAway > 14)
    return "Trip dates outside the available forecast window.";
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(place.latitude));
  url.searchParams.set("longitude", String(place.longitude));
  url.searchParams.set("daily", "precipitation_probability_max");
  url.searchParams.set("forecast_days", "16");
  url.searchParams.set("timezone", "auto");
  const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error("Weather unavailable");
  const data = (await r.json()) as {
    daily?: { time?: string[]; precipitation_probability_max?: number[] };
  };
  const i = data.daily?.time?.indexOf(startDate) ?? -1;
  return i >= 0
    ? `Arrival-day precipitation probability: ${data.daily?.precipitation_probability_max?.[i] ?? "unknown"}%. Open-Meteo forecast.`
    : "No arrival-day forecast available.";
}
export function estimateRoutes(itinerary: Itinerary): RouteEstimate[] {
  const routes: RouteEstimate[] = [];
  for (const day of itinerary.days)
    for (let i = 1; i < day.activities.length; i++) {
      const a = day.activities[i - 1],
        b = day.activities[i];
      const [lat1, lon1, lat2, lon2] = [
        a.location.latitude,
        a.location.longitude,
        b.location.latitude,
        b.location.longitude,
      ];
      if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
        if (a.category === "transportation")
          routes.push({
            from: a.id,
            to: b.id,
            distanceKm: null,
            walkingMinutes: null,
            travelMinutes: a.durationMinutes,
            source: "planner transit estimate",
          });
        else if (b.category === "transportation")
          routes.push({
            from: a.id,
            to: b.id,
            distanceKm: null,
            walkingMinutes: null,
            travelMinutes: b.durationMinutes,
            source: "planner transit estimate",
          });
        continue;
      }
      const rad = Math.PI / 180;
      const h =
        Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
        Math.cos(lat1 * rad) *
          Math.cos(lat2 * rad) *
          Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
      const km = 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
      routes.push({
        from: a.id,
        to: b.id,
        distanceKm: Math.round(km * 100) / 100,
        walkingMinutes: Math.ceil((km / 4.5) * 60),
        source: "straight-line estimate",
      });
    }
  return routes;
}
