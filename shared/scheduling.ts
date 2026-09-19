import type { Activity, Itinerary } from "./itinerary";
import type { TripPreferences } from "./preferences";

export const timeMinutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

// The runtime appends this explicit setting to the planner's preferences.
export function wakeUpTime(preferences: TripPreferences): string | undefined {
  return /Wake-up not before ((?:[01]\d|2[0-3]):[0-5]\d)/.exec(
    preferences.additionalPreferences,
  )?.[1];
}

/** Conservative planning estimate, not a live route or timetable. */
export function transferMinutes(
  from: Activity,
  to: Activity,
  mode: TripPreferences["transportation"] = "walking",
): number {
  const a = from.location,
    b = to.location;
  const known =
    a.latitude !== null &&
    a.longitude !== null &&
    b.latitude !== null &&
    b.longitude !== null;
  if (!known)
    return a.name.trim().toLowerCase() === b.name.trim().toLowerCase() ? 0 : 10;
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.latitude! - a.latitude!) * rad) / 2) ** 2 +
    Math.cos(a.latitude! * rad) *
      Math.cos(b.latitude! * rad) *
      Math.sin(((b.longitude! - a.longitude!) * rad) / 2) ** 2;
  const km = 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
  if (km < 0.05 && a.name.trim().toLowerCase() === b.name.trim().toLowerCase())
    return 0;
  const walking = Math.ceil(((km * 1.25) / 4.5) * 60);
  if (mode === "walking") return Math.max(10, walking);
  const vehicle =
    Math.ceil(((km * 1.3) / 25) * 60) +
    (mode === "rental_car" || mode === "rideshare" ? 10 : 15);
  return Math.max(10, Math.min(walking, vehicle));
}

export function transferIssues(
  day: Itinerary["days"][number],
  preferences: TripPreferences,
): string[] {
  const stops = day.activities.filter((a) => a.category !== "transportation");
  const issues: string[] = [];
  for (let i = 1; i < stops.length; i++) {
    const previous = stops[i - 1],
      next = stops[i];
    const required = transferMinutes(
      previous,
      next,
      preferences.transportation,
    );
    // The time between stops already includes explicit transportation blocks.
    const available =
      timeMinutes(next.startTime) - timeMinutes(previous.endTime);
    if (available < required)
      issues.push(
        `${previous.title} → ${next.title}: ${available} min available; allow at least ${required} min (estimate).`,
      );
  }
  return issues;
}
