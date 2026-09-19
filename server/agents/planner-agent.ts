import { itinerarySchema, validateItinerary, type Itinerary } from '../../shared/itinerary';
import { tripDates, type TripPreferences } from '../../shared/preferences';
import { z } from 'zod';
import type { AIProvider } from '../providers/ai-provider';
import { AppError } from '../errors';
import { PLANNER_INSTRUCTIONS } from './planner-prompt';

export class PlannerAgent {
  constructor(private readonly provider: AIProvider) {}

  async generateItinerary(preferences: TripPreferences): Promise<Itinerary> {
    const dates = tripDates(preferences.startDate, preferences.endDate);
    const schema = itinerarySchema.extend({
      destination: z.literal(preferences.destination),
      startDate: z.literal(preferences.startDate),
      endDate: z.literal(preferences.endDate),
      travelers: z.literal(preferences.travelers),
      days: itinerarySchema.shape.days.length(dates.length),
    });
    const output = await this.provider.generateStructuredOutput({
      instructions: PLANNER_INSTRUCTIONS,
      input: JSON.stringify(preferences),
      schema,
      schemaName: 'travel_itinerary',
    });
    try {
      const itinerary = schema.parse(output);
      // Activity prices are estimates; their totals are arithmetic, not model judgments.
      const days = itinerary.days.map(day => ({
        ...day,
        estimatedDailyCost: day.activities.reduce((sum, activity) => sum + Math.round(activity.estimatedCost * 100), 0) / 100,
      }));
      const totalEstimatedCost = days.reduce((sum, day) => sum + Math.round(day.estimatedDailyCost * 100), 0) / 100;
      return validateItinerary({ ...itinerary, days, totalEstimatedCost }, preferences);
    } catch {
      throw new AppError('INVALID_AI_OUTPUT', 'The planner returned an inconsistent itinerary. Please try again.', 502);
    }
  }
}
