import { tripDates, type TripPreferences } from "../shared/preferences";
import type { Itinerary } from "../shared/itinerary";

export const preferences: TripPreferences = {
  destination: "Tokyo, Japan",
  startDate: "2026-09-20",
  endDate: "2026-09-23",
  travelers: 2,
  budget: 1500,
  interests: ["food", "culture", "technology"],
  pace: "balanced",
  transportation: "public_transit",
  hotelPreference: "mid_range",
  dietaryRestrictions: [],
  additionalPreferences: "Do not schedule anything before 9 AM.",
};

// Test-only data. Never imported by the production server or frontend.
export function validItinerary(): Itinerary {
  return {
    title: "Four days of Tokyo discovery",
    destination: preferences.destination,
    startDate: preferences.startDate,
    endDate: preferences.endDate,
    travelers: 2,
    currency: "USD",
    totalEstimatedCost: 200,
    assumptions: ["Flights excluded."],
    warnings: [],
    days: ["2026-09-20", "2026-09-21", "2026-09-22", "2026-09-23"].map(
      (date, index) => ({
        date,
        summary: `Neighborhood discovery ${index + 1}`,
        estimatedDailyCost: 50,
        activities: [
          {
            id: `day-${index + 1}-visit`,
            title: "Explore Asakusa",
            description: "A relaxed neighborhood walk.",
            category: "activity",
            startTime: "10:00",
            endTime: "12:00",
            durationMinutes: 120,
            location: {
              name: "Asakusa",
              address: null,
              latitude: null,
              longitude: null,
            },
            estimatedCost: 50,
            notes: "Estimated cost for two travelers.",
          },
        ],
      }),
    ),
  };
}

export function strategyFixture(p: TripPreferences) {
  const days = tripDates(p.startDate, p.endDate);
  return {
    title: "Thoughtful Tokyo itinerary",
    rationale:
      "Each day explores a different nearby cluster, with meals, transit buffers and time for the requested interests.",
    stayArea: "Asakusa",
    assumptions: ["Prices are whole-party estimates."],
    warnings: [],
    days: days.map((date, i) => ({
      date,
      theme: `Neighborhood cluster ${i + 1}`,
      neighborhoods: ["Asakusa"],
      anchors: [`Visit ${i + 1} A`, `Visit ${i + 1} B`],
      rationale:
        "Keep nearby visits together to avoid crossing the city repeatedly.",
      targetBudget: p.budget / days.length,
    })),
  };
}
export function detailedDayFixture(
  p: TripPreferences,
  date: string,
): Itinerary["days"][number] {
  const dayIndex = tripDates(p.startDate, p.endDate).indexOf(date);
  const count = p.pace === "packed" ? 8 : 6;
  const clock = (n: number) =>
    `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
  const activities = Array.from({ length: count }, (_, index) => {
    const start = 570 + index * 60;
    const category =
      index === 0 || index === 2
        ? "restaurant"
        : index === 1 || index === 3
          ? "activity"
          : index === count - 1 && date !== p.endDate
            ? "hotel"
            : "free-time";
    return {
      ...validItinerary().days[0].activities[0],
      id: index === 0 ? `day-${dayIndex + 1}-visit` : `${date}-stop-${index}`,
      title: `${category === "restaurant" ? "Local meal" : category === "hotel" ? "Return to hotel" : "Neighborhood discovery"} ${dayIndex + 1}-${index}`,
      category,
      startTime: clock(start),
      endTime: clock(start + 45),
      durationMinutes: 45,
      estimatedCost: 10,
    } as Itinerary["days"][number]["activities"][number];
  });
  return {
    date,
    summary: `Neighborhood discovery ${dayIndex + 1}`,
    activities,
    estimatedDailyCost: activities.length * 10,
  };
}
