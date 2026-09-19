import type { Itinerary } from "../../shared/itinerary";
import { validateItinerary } from "../../shared/itinerary";
import type { TripPreferences } from "../../shared/preferences";
import type { Check, Evaluation, RouteEstimate } from "../../shared/runtime";

export function evaluate(
  itinerary: Itinerary,
  preferences: TripPreferences,
  routes: RouteEstimate[] = [],
): Evaluation {
  const checks: Check[] = [];
  try {
    validateItinerary(itinerary, preferences);
    checks.push({
      name: "Schedule & structure",
      status: "pass",
      detail: "All dates, durations, identities and cost totals reconcile.",
    });
  } catch {
    checks.push({
      name: "Schedule & structure",
      status: "fail",
      detail: "Dates, times, costs or activity identities conflict.",
    });
  }
  checks.push({
    name: "Travel budget",
    status:
      itinerary.totalEstimatedCost <= preferences.budget ? "pass" : "fail",
    detail: `$${itinerary.totalEstimatedCost.toFixed(2)} of $${preferences.budget.toFixed(2)} for the whole party.`,
  });
  const wake = /Wake-up not before (\d{2}:\d{2})/.exec(
    preferences.additionalPreferences,
  )?.[1];
  if (wake)
    checks.push({
      name: "Wake-up time",
      status: itinerary.days.every((d) =>
        d.activities.every((a) => a.startTime >= wake),
      )
        ? "pass"
        : "fail",
      detail: `Nothing scheduled before ${wake}.`,
    });
  const maxWalk = Number(
    /Maximum walking (\d+) minutes/.exec(
      preferences.additionalPreferences,
    )?.[1] || 20,
  );
  const excessive = routes.filter(
    (r) => r.walkingMinutes !== null && r.walkingMinutes > maxWalk,
  );
  checks.push({
    name: "Walking feasibility",
    status:
      preferences.transportation === "walking" && excessive.length
        ? "fail"
        : "unknown",
    detail: `${excessive.length} legs exceed ${maxWalk} minutes by straight-line estimate. Actual routes not verified.`,
  });
  checks.push({
    name: "Opening hours & availability",
    status: "unknown",
    detail:
      "No live venue inventory. Confirm hours and availability before travel.",
  });
  checks.push({
    name: "Dietary suitability",
    status: "unknown",
    detail: "Planner considers preferences; venue confirmation still required.",
  });
  const fail = checks.filter((c) => c.status === "fail").length;
  const unknown = checks.filter((c) => c.status === "unknown").length;
  return {
    score: Math.max(0, 100 - fail * 25 - unknown * 5),
    passed: fail === 0,
    checks,
    feedback: fail
      ? "Repair the failed constraints before relying on this proposal."
      : "Known checks pass. Unverified facts remain clearly marked.",
  };
}

export function recalculate(itinerary: Itinerary): Itinerary {
  const days = itinerary.days.map((d) => ({
    ...d,
    estimatedDailyCost:
      d.activities.reduce((s, a) => s + Math.round(a.estimatedCost * 100), 0) /
      100,
  }));
  return {
    ...itinerary,
    days,
    totalEstimatedCost:
      days.reduce((s, d) => s + Math.round(d.estimatedDailyCost * 100), 0) /
      100,
  };
}
