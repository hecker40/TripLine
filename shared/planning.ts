import { z } from "zod";
import { dateSchema } from "./preferences";

export const tripStrategySchema = z.strictObject({
  title: z.string().min(1).max(180),
  rationale: z.string().min(20).max(1800),
  stayArea: z.string().min(1).max(180),
  assumptions: z.array(z.string().min(1).max(1200)).max(12),
  warnings: z.array(z.string().min(1).max(1200)).max(12),
  days: z
    .array(
      z.strictObject({
        date: dateSchema,
        theme: z.string().min(1).max(180),
        neighborhoods: z.array(z.string().min(1).max(100)).min(1).max(3),
        anchors: z.array(z.string().min(1).max(180)).min(2).max(4),
        rationale: z.string().min(10).max(600),
        targetBudget: z.number().nonnegative(),
      }),
    )
    .min(1)
    .max(7),
});
export type TripStrategy = z.infer<typeof tripStrategySchema>;
