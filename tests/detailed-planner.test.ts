import { test } from "node:test";
import assert from "node:assert/strict";
import { PlannerAgent } from "../server/agents/planner-agent";
import { preferences, strategyFixture, detailedDayFixture } from "./fixtures";
import {
  addTransferBuffers,
  type PlanningProgress,
} from "../server/agents/detailed-planner";
import type { AIProvider } from "../server/providers/ai-provider";
import { zodTextFormat } from "openai/helpers/zod";

function fixtureProvider(): AIProvider {
  return {
    generateStructuredOutput: async (request) => {
      assert.equal(
        zodTextFormat(request.schema, request.schemaName).strict,
        true,
      );
      const input = JSON.parse(request.input);
      return request.schemaName === "trip_strategy"
        ? strategyFixture(input.preferences)
        : detailedDayFixture(input.preferences, input.date);
    },
  };
}
test("strategy plus individual days produces all dates with meals, visits and visible progress", async () => {
  const events: PlanningProgress[] = [];
  const result = await new PlannerAgent(
    fixtureProvider(),
  ).generateDetailedItinerary(preferences, (e) => events.push(e));
  assert.equal(result.itinerary.days.length, 4);
  assert.ok(result.itinerary.days.every((d) => d.activities.length >= 6));
  assert.deepEqual(
    events
      .filter((e) => e.action === "plan.day.complete")
      .map((e) => e.dayIndex),
    [1, 2, 3, 4],
  );
  assert.equal(result.itinerary.totalEstimatedCost, 240);
});
test("one-day and seven-day requests keep exact dates and finish every day", async () => {
  for (const endDate of ["2026-09-20", "2026-09-26"]) {
    const p = { ...preferences, endDate };
    const result = await new PlannerAgent(
      fixtureProvider(),
    ).generateDetailedItinerary(p);
    assert.equal(result.itinerary.days.at(-1)?.date, endDate);
    assert.equal(result.itinerary.days.length, endDate.endsWith("20") ? 1 : 7);
  }
});
test("sparse day retries only that date; never publishes incomplete itinerary", async () => {
  const counts = new Map<string, number>();
  const events: PlanningProgress[] = [];
  const base = fixtureProvider();
  const planner = new PlannerAgent({
    generateStructuredOutput: async (r) => {
      const input = JSON.parse(r.input);
      if (r.schemaName === "itinerary_day") {
        const count = (counts.get(input.date) || 0) + 1;
        counts.set(input.date, count);
        if (input.date === "2026-09-21" && count === 1)
          return {
            ...detailedDayFixture(preferences, input.date),
            activities: [],
          };
      }
      return base.generateStructuredOutput(r);
    },
  });
  const result = await planner.generateDetailedItinerary(preferences, (e) =>
    events.push(e),
  );
  assert.equal(result.itinerary.days.length, 4);
  assert.equal(counts.get("2026-09-20"), 1);
  assert.equal(counts.get("2026-09-21"), 2);
  assert.equal(events.filter((e) => e.action === "plan.day.retry").length, 1);
});
test("missing dates in strategy, malformed days and impossible transfers cannot pass", async () => {
  const badStrategy = strategyFixture(preferences);
  badStrategy.days[1].date = "2026-09-20";
  await assert.rejects(
    new PlannerAgent({
      generateStructuredOutput: async () => badStrategy,
    }).generateDetailedItinerary(preferences),
    /every requested date/,
  );
  const base = fixtureProvider();
  await assert.rejects(
    new PlannerAgent({
      generateStructuredOutput: async (r) => {
        if (r.schemaName === "trip_strategy")
          return base.generateStructuredOutput(r);
        const day = detailedDayFixture(preferences, JSON.parse(r.input).date);
        day.activities[1].startTime = day.activities[0].endTime;
        day.activities[1].endTime = "08:00";
        day.activities[1].location.name = "Distant venue";
        return day;
      },
    }).generateDetailedItinerary(preferences),
    /No incomplete trip/,
  );
});

test("transfer gaps are added deterministically without changing costs or duration", () => {
  const day = detailedDayFixture(preferences, preferences.startDate);
  day.activities[1].startTime = day.activities[0].endTime;
  day.activities[1].endTime = "11:00";
  day.activities[1].location.name = "Nearby museum";
  const result = addTransferBuffers(day);
  assert.equal(result.day.activities[1].startTime, "10:25");
  assert.equal(result.day.activities[1].endTime, "11:10");
  assert.equal(
    result.day.activities[1].estimatedCost,
    day.activities[1].estimatedCost,
  );
  assert.equal(day.activities[1].startTime, "10:15");
  assert.ok(result.adjusted > 0);
});
