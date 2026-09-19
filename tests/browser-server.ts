import { createApp } from '../server/app';
import { tripPreferencesSchema, tripDates } from '../shared/preferences';
import { validItinerary } from './fixtures';

// Explicit test-only provider: production always constructs OpenAIProvider.
const server = createApp({ async generateStructuredOutput(request) {
  const preferences = tripPreferencesSchema.parse(JSON.parse(request.input));
  await new Promise((resolve) => setTimeout(resolve, 250));
  const itinerary = validItinerary();
  itinerary.destination = preferences.destination;
  itinerary.startDate = preferences.startDate;
  itinerary.endDate = preferences.endDate;
  itinerary.travelers = preferences.travelers;
  itinerary.days = tripDates(preferences.startDate, preferences.endDate).map((date, i) => ({
    ...itinerary.days[0], date,
    activities: itinerary.days[0].activities.map((activity) => ({ ...activity, id: `activity-${i}` })),
  }));
  itinerary.totalEstimatedCost = itinerary.days.length * 50;
  return itinerary;
} });
server.listen(8791, '127.0.0.1');
process.on('SIGTERM', () => server.close());
