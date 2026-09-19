import { apiErrorSchema, generationResponseSchema } from '../../shared/api';
import { validateItinerary } from '../../shared/itinerary';
import type { TripPreferences } from '../../shared/preferences';

export async function generateTrip(preferences: TripPreferences, signal: AbortSignal) {
  let response: Response;
  try {
    response = await fetch('/api/trips/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences), signal,
    });
  } catch {
    throw new Error(signal.aborted ? 'Planning took too long. Please try again.' : 'Could not reach TravelOS. Check your connection and try again.');
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(payload);
    if (!parsed.success && response.status === 404) {
      throw new Error('The itinerary API is missing from this deployment. Redeploy TravelOS with its backend functions.');
    }
    if (!parsed.success && response.status === 504) {
      throw new Error('The hosting server timed out while planning. Please try again.');
    }
    throw new Error(parsed.success ? parsed.data.error.message : 'We could not generate your itinerary. Please try again.');
  }
  const parsed = generationResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error('The server returned an invalid itinerary. Please try again.');
  try {
    return validateItinerary(parsed.data.itinerary, preferences);
  } catch {
    throw new Error('The itinerary could not be validated. Please try again.');
  }
}
