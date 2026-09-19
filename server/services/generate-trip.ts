import { tripPreferencesSchema } from '../../shared/preferences';
import { PlannerAgent } from '../agents/planner-agent';
import { AppError } from '../errors';
import type { AIProvider } from '../providers/ai-provider';

// Shared by the local HTTP server and the Vercel function.
export async function generateTrip(input: unknown, provider: AIProvider) {
  const parsed = tripPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('INVALID_PREFERENCES', 'Check your destination, dates (1–7 days), travelers, budget, and preferences.', 400);
  }
  return { itinerary: await new PlannerAgent(provider).generateItinerary(parsed.data) };
}
