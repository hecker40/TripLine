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
