import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  searchBookingStays,
  bookingArguments,
  parseStayOffers,
} from "../server/integrations/booking-mcp";
import type { TripRun } from "../shared/runtime";
import { preferences } from "./fixtures";
const oldId = process.env.BOOKING_AFFILIATE_ID,
  oldToken = process.env.BOOKING_BEARER_TOKEN;
before(() => {
  process.env.BOOKING_AFFILIATE_ID = "1234567";
  process.env.BOOKING_BEARER_TOKEN = "test-only-booking-token";
});
after(() => {
  for (const [name, value] of [
    ["BOOKING_AFFILIATE_ID", oldId],
    ["BOOKING_BEARER_TOKEN", oldToken],
  ]) {
    if (value === undefined) delete process.env[name!];
    else process.env[name!] = value;
  }
});
const properties = {
  destination: { type: "string" },
  checkin_date: { type: "string", format: "date" },
  checkout_date: { type: "string", format: "date" },
  number_of_guests: { type: "integer", minimum: 1 },
  number_of_rooms: { type: "integer", minimum: 1 },
  user_country_code: { type: "string", pattern: "^[a-z]{2}$" },
  currency: { type: "string" },
};
const schema = {
  type: "object",
  properties,
  required: Object.keys(properties).filter((k) => k !== "currency"),
  additionalProperties: false,
};
const query = {
  destination: "Tokyo, Japan",
  checkIn: "2026-09-20",
  checkOut: "2026-09-23",
  adults: 2,
  rooms: 1,
  country: "us",
};
const response = {
  accommodations: [
    {
      id: 1,
      name: "Partner hotel",
      url: "https://www.booking.com/hotel/jp/example.html",
      price: { book: 100, total: 300, currency: "USD" },
    },
  ],
};
function transport(
  calls: string[],
  result: unknown = response,
  discovered: unknown = schema,
): typeof fetch {
  return async (url, init) => {
    assert.match(
      String(url),
      /^https:\/\/demandapi-mcp.booking.com\/v1\/mcp\/1234567$/,
    );
    assert.equal(
      new Headers(init?.headers).get("authorization"),
      "Bearer test-only-booking-token",
    );
    if (init?.method !== "POST") return new Response(null, { status: 405 });
    const body = JSON.parse(String(init.body));
    calls.push(body.method);
    if (body.method.startsWith("notifications/"))
      return new Response(null, { status: 202 });
    let value: unknown;
    if (body.method === "initialize")
      value = {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "test-booking", version: "1" },
      };
    else if (body.method === "tools/list")
      value = {
        tools: [{ name: "accommodations_search", inputSchema: discovered }],
      };
    else if (body.method === "tools/call") {
      assert.equal(body.params.name, "accommodations_search");
      assert.equal(body.params.arguments.checkout_date, preferences.endDate);
      assert.equal(
        body.params.arguments.number_of_guests,
        preferences.travelers,
      );
      value = { content: [], structuredContent: result };
    } else throw new Error("Unexpected method");
    return Response.json({ jsonrpc: "2.0", id: body.id, result: value });
  };
}
test("official MCP lifecycle discovers live schema then searches exact trip dates and guests", async () => {
  const calls: string[] = [];
  const result = await searchBookingStays(
    { preferences } as TripRun,
    1,
    "us",
    transport(calls),
  );
  assert.ok(calls.indexOf("tools/list") < calls.indexOf("tools/call"));
  assert.equal(result.offers[0].totalPrice, 300);
  assert.equal(result.provider, "Booking.com MCP");
  assert.equal(result.checkOut, "2026-09-23");
});
test("changed live schema fails closed before tool execution", async () => {
  const calls: string[] = [];
  const changed = {
    ...schema,
    required: [...schema.required, "new_required_field"],
  };
  await assert.rejects(
    searchBookingStays(
      { preferences } as TripRun,
      1,
      "us",
      transport(calls, response, changed),
    ),
    /current search requirements/,
  );
  assert.ok(!calls.includes("tools/call"));
  assert.throws(
    () => bookingArguments({ type: "object", properties: {} }, query),
    /does not support/,
  );
});
test("unsafe hotel links are rejected and nightly price is never represented as stay total", () => {
  const offers = parseStayOffers({
    accommodations: [
      ...response.accommodations,
      {
        id: 2,
        name: "Bad",
        url: "https://booking.com.evil.example/hotel",
        price: { total: 1, currency: "USD" },
      },
      {
        id: 3,
        name: "Nightly only",
        url: "https://www.booking.com/hotel/jp/other.html",
        price: { book: 100, currency: "USD" },
      },
    ],
  });
  assert.equal(offers.length, 2);
  assert.equal(offers[1].totalPrice, null);
});
test("missing credentials are explicit and never use OpenAI key", async () => {
  delete process.env.BOOKING_BEARER_TOKEN;
  try {
    await assert.rejects(
      searchBookingStays({ preferences } as TripRun, 1, "us", async () => {
        throw new Error("Must not request");
      }),
      /OpenAI key is separate/,
    );
  } finally {
    process.env.BOOKING_BEARER_TOKEN = "test-only-booking-token";
  }
});
test("authorization failures are sanitized and one-day trips do not search", async () => {
  await assert.rejects(
    searchBookingStays(
      { preferences } as TripRun,
      1,
      "us",
      async () => new Response("secret provider detail", { status: 401 }),
    ),
    (error) =>
      error instanceof Error &&
      !error.message.includes("secret provider detail") &&
      !error.message.includes("test-only-booking-token"),
  );
  await assert.rejects(
    searchBookingStays(
      {
        preferences: { ...preferences, endDate: preferences.startDate },
      } as TripRun,
      1,
      "us",
    ),
    /no overnight stay/,
  );
});
