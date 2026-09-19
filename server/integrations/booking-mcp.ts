import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import Ajv from "ajv";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { z } from "zod";
import type { TripRun } from "../../shared/runtime";
import type { StayOffer, StaySearch } from "../../shared/booking";
import { AppError } from "../errors";

export function bookingConfigured() {
  return (
    /^\d+$/.test(process.env.BOOKING_AFFILIATE_ID?.trim() || "") &&
    Boolean(process.env.BOOKING_BEARER_TOKEN?.trim())
  );
}
export interface StayQuery {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms: number;
  country: string;
}

// Map known semantics only, then validate against the account's live schema.
// Unknown required fields fail closed instead of guessing an API request.
export function bookingArguments(
  schema: Record<string, unknown>,
  query: StayQuery,
): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    destination: query.destination,
    checkin_date: query.checkIn,
    checkout_date: query.checkOut,
    number_of_guests: query.adults,
    number_of_rooms: query.rooms,
    user_country_code: query.country,
    currency: "USD",
  };
  const properties =
    schema.properties && typeof schema.properties === "object"
      ? (schema.properties as Record<string, unknown>)
      : {};
  const args = Object.fromEntries(
    Object.entries(fields).filter(([key]) => key in properties),
  );
  if (
    ![
      "destination",
      "checkin_date",
      "checkout_date",
      "number_of_guests",
      "number_of_rooms",
      "user_country_code",
    ].every((key) => key in args)
  )
    throw new AppError(
      "BOOKING_SCHEMA_CHANGED",
      "Booking.com published a search schema this adapter does not support yet. No search was sent.",
      502,
    );
  try {
    const validator = String(schema.$schema || "").includes("2020")
      ? new Ajv2020({ strict: false, allErrors: true })
      : new Ajv({ strict: false, allErrors: true });
    addFormats(validator);
    if (!validator.compile(schema)(args)) throw new Error("Invalid arguments");
  } catch {
    throw new AppError(
      "BOOKING_SCHEMA_CHANGED",
      "Your trip does not match Booking.com’s current search requirements. No search was sent.",
      502,
    );
  }
  return args;
}

const responseSchema = z
  .object({
    accommodations: z
      .array(
        z
          .object({
            id: z.union([z.number(), z.string()]),
            name: z.string().min(1).max(500),
            url: z.string().max(3000),
            price: z
              .object({
                total: z.number().nonnegative().nullable().optional(),
                currency: z
                  .string()
                  .regex(/^[A-Z]{3}$/)
                  .nullable()
                  .optional(),
              })
              .passthrough()
              .optional(),
          })
          .passthrough(),
      )
      .max(1000),
  })
  .passthrough();
export function parseStayOffers(value: unknown): StayOffer[] {
  const parsed = responseSchema.safeParse(value);
  if (!parsed.success)
    throw new AppError(
      "BOOKING_INVALID_RESULT",
      "Booking.com returned an unsupported result. No availability was fabricated.",
      502,
    );
  return parsed.data.accommodations
    .flatMap((a) => {
      try {
        const url = new URL(a.url);
        if (
          url.protocol !== "https:" ||
          !(
            url.hostname === "booking.com" ||
            url.hostname.endsWith(".booking.com")
          ) ||
          url.username ||
          url.password
        )
          return [];
        return [
          {
            id: String(a.id),
            name: a.name,
            url: url.toString(),
            totalPrice: a.price?.total ?? null,
            currency: a.price?.currency ?? null,
          },
        ];
      } catch {
        return [];
      }
    })
    .slice(0, 8);
}

export async function searchBookingStays(
  run: TripRun,
  rooms: number,
  country: string,
  transportFetch: typeof fetch = fetch,
): Promise<StaySearch> {
  if (run.preferences.endDate <= run.preferences.startDate)
    throw new AppError(
      "NO_OVERNIGHT_STAY",
      "A one-day trip has no overnight stay to search. Choose at least two days.",
      400,
    );
  if (rooms > run.preferences.travelers)
    throw new AppError(
      "INVALID_ROOMS",
      "Rooms cannot exceed the number of travelers.",
      400,
    );
  if (!bookingConfigured())
    throw new AppError(
      "BOOKING_NOT_CONFIGURED",
      "Live hotel search needs BOOKING_AFFILIATE_ID and BOOKING_BEARER_TOKEN from a Booking.com partner account. Your OpenAI key is separate.",
      503,
    );
  const query: StayQuery = {
    destination: run.preferences.destination,
    checkIn: run.preferences.startDate,
    checkOut: run.preferences.endDate,
    adults: run.preferences.travelers,
    rooms,
    country,
  };
  const client = new Client({
    name: "travelos-booking-search",
    version: "1.0.0",
  });
  const transport = new StreamableHTTPClientTransport(
    new URL(
      `https://demandapi-mcp.booking.com/v1/mcp/${process.env.BOOKING_AFFILIATE_ID!.trim()}`,
    ),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${process.env.BOOKING_BEARER_TOKEN!.trim()}`,
        },
      },
      fetch: async (url, init) =>
        transportFetch(url, {
          ...init,
          redirect: "error",
          signal: AbortSignal.any([
            ...(init?.signal ? [init.signal] : []),
            AbortSignal.timeout(15_000),
          ]),
        }),
      reconnectionOptions: {
        maxRetries: 0,
        initialReconnectionDelay: 1000,
        maxReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1,
      },
    },
  );
  try {
    await client.connect(transport, { timeout: 15_000 });
    let cursor: string | undefined;
    let searchTool:
      Awaited<ReturnType<Client["listTools"]>>["tools"][number] | undefined;
    for (let page = 0; page < 3; page++) {
      const list = await client.listTools(cursor ? { cursor } : {}, {
        timeout: 15_000,
      });
      searchTool = list.tools.find((t) => t.name === "accommodations_search");
      if (searchTool || !list.nextCursor) break;
      cursor = list.nextCursor;
    }
    if (!searchTool)
      throw new AppError(
        "BOOKING_TOOL_UNAVAILABLE",
        "This Booking.com partner account does not expose accommodation search.",
        503,
      );
    const args = bookingArguments(searchTool.inputSchema, query);
    const result = await client.callTool(
      { name: "accommodations_search", arguments: args },
      undefined,
      { timeout: 20_000 },
    );
    if (result.isError)
      throw new AppError(
        "BOOKING_SEARCH_FAILED",
        "Booking.com could not complete this search. Check dates and partner access, then try again.",
        502,
      );
    let content: unknown = result.structuredContent;
    if (!content && Array.isArray(result.content)) {
      const text = result.content.find((c) => c.type === "text");
      if (text && typeof text.text === "string")
        content = JSON.parse(text.text);
    }
    const offers = parseStayOffers(content);
    return {
      provider: "Booking.com MCP",
      checkedAt: new Date().toISOString(),
      ...query,
      offers,
      message: offers.length
        ? "Live search results for your trip dates and party. Prices and availability can change. Review final charges and room details on Booking.com before booking."
        : "No displayable stays returned for these dates and party. No substitute listings were invented.",
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "BOOKING_CONNECTION_FAILED",
      "Booking.com MCP could not complete the request. Check affiliate access, token and network connectivity. Your itinerary is unchanged.",
      502,
    );
  } finally {
    await client.close().catch(() => {});
  }
}
