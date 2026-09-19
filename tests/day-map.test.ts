import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDayMap } from "../server/services/day-map";
import { mapsHandler } from "../server/routes/maps";
import type { TripRun } from "../shared/runtime";
import { preferences, validItinerary } from "./fixtures";

function run() {
  const itinerary = validItinerary();
  const a = itinerary.days[0].activities[0];
  a.location.latitude = 35.714;
  a.location.longitude = 139.797;
  itinerary.days[0].activities.push({
    ...structuredClone(a),
    id: "second",
    startTime: "13:00",
    endTime: "15:00",
    location: {
      name: "Ueno",
      address: null,
      latitude: 35.715,
      longitude: 139.774,
    },
  });
  return {
    itinerary,
    preferences,
    research: { name: "Tokyo", latitude: 35.68, longitude: 139.76 },
  } as TripRun;
}
const response = {
  code: "Ok",
  routes: [
    {
      legs: [
        {
          distance: 2100,
          duration: 1500,
          steps: [
            {
              geometry: {
                coordinates: [
                  [139.797, 35.714],
                  [139.78, 35.72],
                  [139.774, 35.715],
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};
test("day route uses only selected day, real geometry and walking profile", async () => {
  const urls: URL[] = [];
  const result = await buildDayMap(
    run(),
    "2026-09-20",
    "walking",
    async (url) => {
      urls.push(url);
      return response;
    },
  );
  assert.equal(urls.length, 1);
  assert.match(urls[0].pathname, /routed-foot/);
  assert.equal(result.stops.length, 2);
  assert.equal(result.legs[0].minutes, 25);
  assert.deepEqual(result.legs[0].coordinates[0], [35.714, 139.797]);
  assert.equal(result.legs[0].to, "second");
});
test("changing day never mixes stops from another day", async () => {
  const trip = run();
  trip.itinerary.days[1].activities[0].location =
    trip.itinerary.days[0].activities[0].location;
  const result = await buildDayMap(trip, "2026-09-21", "driving", async () => {
    throw new Error("Should not need route");
  });
  assert.deepEqual(
    result.stops.map((s) => s.id),
    ["day-2-visit"],
  );
  assert.equal(result.legs.length, 0);
});
test("route outage never fabricates a navigation line", async () => {
  const result = await buildDayMap(run(), "2026-09-20", "driving", async () => {
    throw new Error("Timeout");
  });
  assert.equal(result.stops.length, 2);
  assert.equal(result.legs.length, 0);
  assert.match(result.warnings.join(" "), /unavailable/);
});
test("unknown coordinates use labelled geocoder matches", async () => {
  const trip = run();
  trip.itinerary.days[0].activities[0].location.latitude = null;
  const result = await buildDayMap(
    trip,
    "2026-09-20",
    "walking",
    async (url) =>
      url.hostname === "photon.komoot.io"
        ? {
            features: [
              {
                geometry: { coordinates: [139.797, 35.714] },
                properties: { name: "Asakusa", city: "Tokyo" },
              },
            ],
          }
        : response,
  );
  assert.equal(result.stops[0].source, "Photon match");
  assert.equal(result.stops[0].matchedName, "Asakusa, Tokyo");
});
test("unmapped stop breaks route continuity instead of silently skipping it", async () => {
  const trip = run();
  const middle = {
    ...structuredClone(trip.itinerary.days[0].activities[0]),
    id: "unknown",
    location: {
      name: "Unknown",
      address: null,
      latitude: null,
      longitude: null,
    },
  };
  trip.itinerary.days[0].activities.splice(1, 0, middle);
  const result = await buildDayMap(
    trip,
    "2026-09-20",
    "walking",
    async (url) =>
      url.hostname === "photon.komoot.io" ? { features: [] } : response,
  );
  assert.equal(result.legs.length, 0);
  assert.equal(result.stops[1].source, "unavailable");
});
test("reject distant same-name venue matches", async () => {
  const trip = run();
  trip.itinerary.days[0].activities[0].location.latitude = null;
  const result = await buildDayMap(trip, "2026-09-20", "walking", async () => ({
    features: [
      {
        geometry: { coordinates: [-73.9, 40.7] },
        properties: { name: "Asakusa" },
      },
    ],
  }));
  assert.equal(result.stops[0].coordinates, null);
});
test("map endpoint requires authentic trip and rejects bad methods", async () => {
  assert.equal(
    (await mapsHandler(new Request("http://test/api/maps"))).status,
    405,
  );
  const result = await mapsHandler(
    new Request("http://test/api/maps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        envelope: {},
        date: "2026-09-20",
        mode: "walking",
      }),
    }),
  );
  assert.equal(result.status, 400);
});
