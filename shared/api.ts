import { z } from 'zod';
import { itinerarySchema } from './itinerary';

export const generationResponseSchema = z.strictObject({ itinerary: itinerarySchema });
export const apiErrorSchema = z.object({ error: z.object({ code: z.string(), message: z.string() }) });
export type ApiError = z.infer<typeof apiErrorSchema>;
