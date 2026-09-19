import type { TripPreferences } from '../shared/preferences';
import type { Itinerary } from '../shared/itinerary';

export const preferences: TripPreferences = {
  destination: 'Tokyo, Japan', startDate: '2026-09-20', endDate: '2026-09-23',
  travelers: 2, budget: 1500, interests: ['food', 'culture', 'technology'],
  pace: 'balanced', transportation: 'public_transit', hotelPreference: 'mid_range',
  dietaryRestrictions: [], additionalPreferences: 'Do not schedule anything before 9 AM.',
};

// Test-only data. Never imported by the production server or frontend.
export function validItinerary(): Itinerary {
  return {
    title: 'Four days of Tokyo discovery', destination: preferences.destination,
    startDate: preferences.startDate, endDate: preferences.endDate, travelers: 2,
    currency: 'USD', totalEstimatedCost: 200, assumptions: ['Flights excluded.'], warnings: [],
    days: ['2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23'].map((date, index) => ({
      date, summary: `Neighborhood discovery ${index + 1}`, estimatedDailyCost: 50,
      activities: [{
        id: `day-${index + 1}-visit`, title: 'Explore Asakusa', description: 'A relaxed neighborhood walk.',
        category: 'activity', startTime: '10:00', endTime: '12:00', durationMinutes: 120,
        location: { name: 'Asakusa', address: null, latitude: null, longitude: null },
        estimatedCost: 50, notes: 'Estimated cost for two travelers.',
      }],
    })),
  };
}
