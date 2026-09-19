import { useRef, useState } from 'react';
import type { Itinerary } from '../../shared/itinerary';
import type { TripPreferences } from '../../shared/preferences';
import { generateTrip } from '../lib/api';

export function useTripPlanner() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [plannedPreferences, setPlannedPreferences] = useState<TripPreferences | null>(null);
  const [lastAttempt, setLastAttempt] = useState<TripPreferences | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function generate(preferences: TripPreferences) {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsGenerating(true);
    setGenerationError(null);
    setLastAttempt(preferences);
    try {
      const next = await generateTrip(preferences, AbortSignal.timeout(100_000));
      setItinerary(next);
      setPlannedPreferences(preferences);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'We could not generate your itinerary.');
    } finally {
      inFlight.current = false;
      setIsGenerating(false);
    }
  }

  return { itinerary, plannedPreferences, lastAttempt, isGenerating, generationError, generate };
}
