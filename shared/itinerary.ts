import { z } from 'zod';
import { dateSchema, MAX_TRIP_DAYS, tripDates, type TripPreferences } from './preferences';

const text = z.string().min(1).max(1200);
const cost = z.number().min(0).max(10_000_000);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const activitySchema = z.strictObject({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(180),
  description: text,
  category: z.enum(['activity', 'restaurant', 'transportation', 'hotel', 'free-time']),
  startTime: time,
  endTime: time,
  location: z.strictObject({
    name: z.string().min(1).max(180),
    address: z.string().max(300).nullable(),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
  }),
  estimatedCost: cost,
  durationMinutes: z.number().int().min(1).max(1439),
  notes: z.string().max(1200),
});

// One JSON-serializable shape is shared by the provider, API, and UI.
// Cross-field checks live below, not in a duplicated provider schema.
export const itinerarySchema = z.strictObject({
  title: z.string().min(1).max(180),
  destination: z.string().min(1).max(120),
  startDate: dateSchema,
  endDate: dateSchema,
  travelers: z.number().int().min(1).max(12),
  currency: z.literal('USD'),
  totalEstimatedCost: cost,
  assumptions: z.array(text).max(12),
  warnings: z.array(text).max(12),
  days: z.array(z.strictObject({
    date: dateSchema,
    summary: text,
    estimatedDailyCost: cost,
    activities: z.array(activitySchema).min(1).max(18),
  })).min(1).max(MAX_TRIP_DAYS),
});

export type Itinerary = z.infer<typeof itinerarySchema>;
export type Activity = z.infer<typeof activitySchema>;

const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
const cents = (value: number) => Math.round(value * 100);

export function validateItinerary(output: unknown, preferences: TripPreferences): Itinerary {
  const itinerary = itinerarySchema.parse(output);
  const expectedDates = tripDates(preferences.startDate, preferences.endDate);
  if (itinerary.destination !== preferences.destination || itinerary.startDate !== preferences.startDate
    || itinerary.endDate !== preferences.endDate || itinerary.travelers !== preferences.travelers
    || itinerary.days.length !== expectedDates.length) {
    throw new Error('Itinerary metadata does not match the request.');
  }
  const ids = new Set<string>();
  for (const [index, day] of itinerary.days.entries()) {
    if (day.date !== expectedDates[index]) throw new Error('Missing, duplicate, or unordered trip dates.');
    let previousEnd = 0;
    for (const activity of day.activities) {
      const start = minutes(activity.startTime);
      const end = minutes(activity.endTime);
      if (ids.has(activity.id) || start < previousEnd || end <= start || end - start !== activity.durationMinutes) {
        throw new Error('Invalid activity identity, time order, or duration.');
      }
      ids.add(activity.id);
      previousEnd = end;
    }
    const dailyCents = day.activities.reduce((sum, activity) => sum + cents(activity.estimatedCost), 0);
    if (cents(day.estimatedDailyCost) !== dailyCents) throw new Error('Daily costs do not reconcile.');
  }
  if (cents(itinerary.totalEstimatedCost) !== itinerary.days.reduce((sum, day) => sum + cents(day.estimatedDailyCost), 0)) {
    throw new Error('Trip costs do not reconcile.');
  }
  return itinerary;
}
