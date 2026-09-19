import { z } from 'zod';

export const MAX_TRIP_DAYS = 7;
export const paceOptions = ['relaxed', 'balanced', 'packed'] as const;
export const transportationOptions = ['public_transit', 'walking', 'rental_car', 'rideshare', 'mixed'] as const;
export const hotelOptions = ['budget', 'mid_range', 'luxury', 'no_preference'] as const;

export const dateSchema = z.iso.date();
export function tripDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last && dates.length <= MAX_TRIP_DAYS) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

const tags = z.array(z.string().trim().min(1).max(60)).max(15);
export const tripPreferencesSchema = z.strictObject({
  destination: z.string().trim().min(1, 'Enter a destination.').max(120),
  startDate: dateSchema,
  endDate: dateSchema,
  travelers: z.number().int().min(1).max(12),
  budget: z.number().positive().max(1_000_000),
  interests: tags,
  pace: z.enum(paceOptions),
  transportation: z.enum(transportationOptions),
  hotelPreference: z.enum(hotelOptions),
  dietaryRestrictions: tags,
  additionalPreferences: z.string().trim().max(2000),
}).superRefine((value, ctx) => {
  if (value.endDate < value.startDate) {
    ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must be on or after the start date.' });
  } else if (tripDates(value.startDate, value.endDate).length > MAX_TRIP_DAYS) {
    ctx.addIssue({ code: 'custom', path: ['endDate'], message: `Choose a trip of 1–${MAX_TRIP_DAYS} days, including both dates.` });
  }
});

export type TripPreferences = z.infer<typeof tripPreferencesSchema>;
