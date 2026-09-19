import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addTransferBuffers,
  validatePlannedDay,
} from "../server/agents/detailed-planner";
import { evaluate } from "../server/runtime/evaluate";
import {
  timeMinutes,
  transferIssues,
  transferMinutes,
} from "../shared/scheduling";
import { preferences, validItinerary, detailedDayFixture } from "./fixtures";

test("wake-up constraint shifts the whole day, preserves durations, and stays non-overlapping", () => {
  const p = {
    ...preferences,
    additionalPreferences: "Wake-up not before 11:00",
  };
  const source = detailedDayFixture(p, p.startDate);
  const result = addTransferBuffers(source, p).day;
  assert.equal(result.activities[0].startTime, "11:00");
  for (const [i, activity] of result.activities.entries()) {
    assert.equal(
      activity.durationMinutes,
      source.activities[i].durationMinutes,
    );
    if (i) assert.ok(activity.startTime >= result.activities[i - 1].endTime);
  }
  validatePlannedDay(result, p, p.endDate);
  assert.equal(source.activities[0].startTime, "09:30");
});

test("cross-city visits use distance-aware buffers rather than a flat ten minutes", () => {
  const source = detailedDayFixture(preferences, preferences.startDate);
  source.activities = source.activities.slice(0, 2);
  const [a, b] = source.activities;
  a.location = {
    name: "Asakusa",
    address: null,
    latitude: 35.714,
    longitude: 139.797,
  };
  b.location = {
    name: "Shibuya",
    address: null,
    latitude: 35.659,
    longitude: 139.701,
  };
  const walking = { ...preferences, transportation: "walking" as const };
  assert.ok(transferMinutes(a, b, "walking") > 100);
  assert.ok(transferMinutes(a, b, "public_transit") > 30);
  assert.equal(transferIssues(source, walking).length, 1);
  const adjusted = addTransferBuffers(source, walking).day;
  assert.equal(transferIssues(adjusted, walking).length, 0);
  assert.equal(
    timeMinutes(adjusted.activities[1].startTime) - timeMinutes(a.endTime),
    transferMinutes(a, b, "walking"),
  );
});

test("explicit transit consumes the transfer budget once, and cannot hide impossible short transfers", () => {
  const source = detailedDayFixture(preferences, preferences.startDate);
  source.activities = source.activities.slice(0, 3);
  const [a, transit, b] = source.activities;
  a.location = {
    name: "Asakusa",
    address: null,
    latitude: 35.714,
    longitude: 139.797,
  };
  b.location = {
    name: "Shibuya",
    address: null,
    latitude: 35.659,
    longitude: 139.701,
  };
  transit.category = "transportation";
  transit.startTime = a.endTime;
  transit.endTime = "10:16";
  transit.durationMinutes = 1;
  b.startTime = "10:16";
  b.endTime = "11:01";
  assert.equal(transferIssues(source, preferences).length, 1);
  const normalized = addTransferBuffers(source, preferences).day;
  assert.equal(transferIssues(normalized, preferences).length, 0);
  const again = addTransferBuffers(normalized, preferences);
  assert.equal(again.adjusted, 0);
  assert.deepEqual(again.day, normalized);
});

test("an infeasible late-day transfer is rejected instead of wrapping into tomorrow", () => {
  const source = detailedDayFixture(preferences, preferences.startDate);
  const p = {
    ...preferences,
    additionalPreferences: "Wake-up not before 23:30",
  };
  assert.throws(() => addTransferBuffers(source, p), /before midnight/);
});

test("departure-day hotel costs cannot silently add an extra night", () => {
  const source = detailedDayFixture(preferences, preferences.endDate);
  source.activities.at(-1)!.category = "hotel";
  assert.throws(
    () => validatePlannedDay(source, preferences, preferences.endDate),
    /departure day/,
  );
  source.activities.at(-1)!.estimatedCost = 0;
  assert.doesNotThrow(() =>
    validatePlannedDay(source, preferences, preferences.endDate),
  );
});

test("evaluator detects insufficient transfer gaps even when activity times do not overlap", () => {
  const itinerary = validItinerary();
  const a = itinerary.days[0].activities[0];
  itinerary.days[0].activities.push({
    ...a,
    id: "instant-transfer",
    startTime: "12:00",
    endTime: "14:00",
    estimatedCost: 0,
    location: { ...a.location, name: "Different venue" },
  });
  const evaluation = evaluate(itinerary, preferences);
  assert.equal(
    evaluation.checks.find((c) => c.name === "Schedule & structure")?.status,
    "pass",
  );
  assert.equal(
    evaluation.checks.find((c) => c.name === "Transfer buffers")?.status,
    "fail",
  );
});
