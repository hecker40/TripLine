import { z } from "zod";
import { readJson } from "./generate";
import { safeError } from "../errors";
import { unseal } from "../runtime/state";
import { buildDayMap } from "../services/day-map";

export async function mapsHandler(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  if (request.method !== "POST")
    return Response.json(
      { error: { message: "Use POST." } },
      { status: 405, headers },
    );
  try {
    const parsed = z
      .object({
        envelope: z.unknown(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        mode: z.enum(["walking", "driving"]),
      })
      .safeParse(await readJson(request, 500_000));
    if (!parsed.success)
      return Response.json(
        { error: { message: "Choose a valid day and route mode." } },
        { status: 400, headers },
      );
    const { envelope, date, mode } = parsed.data;
    return Response.json(await buildDayMap(unseal(envelope), date, mode), {
      headers,
    });
  } catch (error) {
    const e = safeError(error);
    return Response.json(
      { error: { code: e.code, message: e.message } },
      { status: e.status, headers },
    );
  }
}
