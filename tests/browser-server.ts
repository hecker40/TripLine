import { createApp } from "../server/app";
import { tripPreferencesSchema, tripDates } from "../shared/preferences";
import { validItinerary } from "./fixtures";
import type { AIProvider } from "../server/providers/ai-provider";
process.env.TRAVELOS_ENGINE = "openai";
process.env.TRAVELOS_OPENAI_API_KEY = "test-only-browser-key";
const provider: AIProvider = {
  async generateStructuredOutput(request) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (request.schemaName === "travel_critique")
      return {
        summary: "Test-only preference review.",
        preferenceFit: 90,
        concerns: [],
      };
    if (request.schemaName === "day_adaptation") {
      const input = JSON.parse(request.input);
      return {
        summary: "Adjusted after a missed train",
        explanation: "Moved the affected stop; other days preserved.",
        activities: input.remaining.map(
          (a: Record<string, unknown>, index: number) => ({
            ...a,
            title: index === 0 ? "Recovered visit" : a.title,
          }),
        ),
      };
    }
    if (request.schemaName === "activity_repair") {
      const input = JSON.parse(request.input);
      return {
        ...input.original,
        title: "Replacement venue",
        estimatedCost: Math.min(30, input.maximumCost),
        location: { ...input.original.location, name: "Alternative venue" },
      };
    }
    if (request.schemaName === "recovery_summary")
      return { summary: "Fallback test complete." };
    const preferences = tripPreferencesSchema.parse(JSON.parse(request.input));
    const itinerary = validItinerary();
    Object.assign(itinerary, {
      destination: preferences.destination,
      startDate: preferences.startDate,
      endDate: preferences.endDate,
      travelers: preferences.travelers,
    });
    itinerary.days = tripDates(preferences.startDate, preferences.endDate).map(
      (date, i) => ({
        ...itinerary.days[0],
        date,
        activities: itinerary.days[0].activities.map((a) => ({
          ...a,
          id: `activity-${i}`,
          category: i === 0 ? "hotel" : i === 1 ? "restaurant" : "activity",
          location: {
            name: "Asakusa",
            address: null,
            latitude: 35.714,
            longitude: 139.797,
          },
        })),
      }),
    );
    itinerary.days.forEach((day, index) => {
      day.activities.push({
        ...structuredClone(day.activities[0]),
        id: `afternoon-${index}`,
        title: "Ueno park visit",
        category: "activity",
        startTime: "14:00",
        endTime: "15:00",
        durationMinutes: 60,
        estimatedCost: 0,
        location: {
          name: "Ueno Park",
          address: null,
          latitude: 35.715,
          longitude: 139.774,
        },
      });
    });
    itinerary.totalEstimatedCost = itinerary.days.length * 50;
    return itinerary;
  },
};
// Production does not import this explicit test-only dependency injection.
const server = createApp(provider, {
  models: () => ({ provider: () => provider }),
  research: async () => null,
});
server.listen(8791, "127.0.0.1");
process.on("SIGTERM", () => server.close());
