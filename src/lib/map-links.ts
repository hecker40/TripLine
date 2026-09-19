import type { Activity } from "../../shared/itinerary";

export function placeLink(activity: Activity, destination: string) {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: `${activity.location.name}, ${activity.location.address || destination}` })}`;
}
export function directionsLink(
  from: Activity,
  to: Activity,
  destination: string,
  mode: "walking" | "driving" | "transit",
) {
  const location = (a: Activity) =>
    `${a.location.name}, ${a.location.address || destination}`;
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: "1", origin: location(from), destination: location(to), travelmode: mode })}`;
}
