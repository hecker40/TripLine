import { z } from "zod";

export const coordinateSchema = z.tuple([
  z.number().min(-90).max(90),
  z.number().min(-180).max(180),
]);
export const dayMapSchema = z.object({
  date: z.string(),
  mode: z.enum(["walking", "driving"]),
  stops: z.array(
    z.object({
      id: z.string(),
      coordinates: coordinateSchema.nullable(),
      source: z.enum(["planner", "Photon match", "unavailable"]),
      matchedName: z.string().nullable(),
    }),
  ),
  legs: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      coordinates: z.array(coordinateSchema),
      distanceKm: z.number().nonnegative(),
      minutes: z.number().nonnegative(),
    }),
  ),
  warnings: z.array(z.string()),
});
export type DayMap = z.infer<typeof dayMapSchema>;
export type RouteMode = DayMap["mode"];
