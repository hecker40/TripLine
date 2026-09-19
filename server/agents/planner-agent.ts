import { itinerarySchema, validateItinerary, type Itinerary } from '../../shared/itinerary';
import type { TripPreferences } from '../../shared/preferences';
import type { AIProvider } from '../providers/ai-provider';
import { AppError } from '../errors';
import { PLANNER_INSTRUCTIONS } from './planner-prompt';

export class PlannerAgent {
  constructor(private readonly provider: AIProvider) {}

  async generateItinerary(preferences: TripPreferences): Promise<Itinerary> {
    const output = await this.provider.generateStructuredOutput({
      instructions: PLANNER_INSTRUCTIONS,
      input: JSON.stringify(preferences),
      schema: itinerarySchema,
      schemaName: 'travel_itinerary',
    });
    try {
      return validateItinerary(output, preferences);
    } catch {
      throw new AppError('INVALID_AI_OUTPUT', 'The planner returned an inconsistent itinerary. Please try again.', 502);
    }
  }
}
