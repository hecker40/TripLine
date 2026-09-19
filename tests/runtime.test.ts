import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  executeRuntime,
  type RuntimeDependencies,
} from "../server/runtime/engine";
import { seal, unseal } from "../server/runtime/state";
import { evaluate } from "../server/runtime/evaluate";
import { assertPermission } from "../server/runtime/tools";
import { RuntimeModels } from "../server/runtime/models";
import { runtimeHandler } from "../server/routes/runtime";
import { z } from "zod";
import type { RuntimeMessage, TripRun, TraceEvent } from "../shared/runtime";
import {
  preferences,
  validItinerary,
  strategyFixture,
  detailedDayFixture,
} from "./fixtures";
const previous = process.env.TRAVELOS_OPENAI_API_KEY;
const previousEngine = process.env.TRAVELOS_ENGINE;
before(() => {
  process.env.TRAVELOS_OPENAI_API_KEY = "test-only-key";
  process.env.TRAVELOS_ENGINE = "openai";
});
after(() => {
  if (previousEngine === undefined) delete process.env.TRAVELOS_ENGINE;
  else process.env.TRAVELOS_ENGINE = previousEngine;
  if (previous === undefined) delete process.env.TRAVELOS_OPENAI_API_KEY;
  else process.env.TRAVELOS_OPENAI_API_KEY = previous;
});
const itinerary = () => {
  const i = validItinerary();
  i.days[0].activities[0].category = "restaurant";
  i.days[0].activities[0].location = {
    name: "Asakusa",
    address: null,
    latitude: 35.714,
    longitude: 139.797,
  };
  return i;
};
const dependencies: RuntimeDependencies = {
  research: async () => null,
  models: () => ({
    provider: () => ({
      generateStructuredOutput: async (r) =>
        r.schemaName === "trip_strategy"
          ? strategyFixture(JSON.parse(r.input).preferences)
          : r.schemaName === "itinerary_day"
            ? detailedDayFixture(
                JSON.parse(r.input).preferences,
                JSON.parse(r.input).date,
              )
            : r.schemaName === "travel_itinerary"
              ? itinerary()
              : r.schemaName === "activity_repair"
                ? {
                    ...JSON.parse(r.input).original,
                    title: "Alternative lunch",
                    location: {
                      name: "New cafe",
                      address: null,
                      latitude: 35.715,
                      longitude: 139.798,
                    },
                  }
                : {
                    summary: "Good preference fit.",
                    preferenceFit: 90,
                    concerns: [],
                  },
    }),
  }),
};
async function execute(input: unknown, deps = dependencies) {
  const events: RuntimeMessage[] = [];
  await executeRuntime(input, (e) => events.push(e), deps);
  const result = [...events].reverse().find((e) => e.type === "result");
  assert.ok(result && result.type === "result");
  return { data: result.data, events };
}
const generate = () => execute({ action: "generate", preferences });

test("runtime generates, evaluates, streams events and signs the result", async () => {
  const { data, events } = await generate();
  assert.equal(data.run.itinerary.days.length, 4);
  assert.equal(data.run.engine, "openai");
  assert.ok(events.some((e) => e.type === "trace"));
  assert.equal(unseal(data).id, data.run.id);
  assert.equal(
    data.run.evaluation.checks.find(
      (c) => c.name === "Opening hours & availability",
    )?.status,
    "unknown",
  );
});
test("signed trip state rejects modified costs or proof", async () => {
  const { data } = await generate();
  const changed = structuredClone(data);
  changed.run.executionBudget = 100;
  assert.throws(() => unseal(changed));
  assert.throws(() => unseal({ ...data, proof: "bad" }));
});
test("signed trip expires after 24 hours", async () => {
  const { data } = await generate();
  data.run.createdAt = new Date(Date.now() - 90_000_000).toISOString();
  assert.throws(() => unseal(seal(data.run)));
});
test("unauthorized tool blocked without calling a model", async () => {
  const { data } = await generate();
  const result = await execute({
    action: "chaos",
    kind: "unauthorized_tool",
    envelope: data,
  });
  assert.ok(
    result.data.run.trace.some(
      (e) => e.action === "hotel.cancel" && e.status === "blocked",
    ),
  );
  assert.throws(() => assertPermission("Planner", "payment.execute"));
});
test("booking request pauses for approval; decision creates no booking", async () => {
  const { data } = await generate();
  const pending = await execute({
    action: "chaos",
    kind: "booking_request",
    envelope: data,
  });
  assert.equal(pending.data.run.approvals[0].status, "pending");
  const approved = await execute({
    action: "approve",
    envelope: pending.data,
    approvalId: pending.data.run.approvals[0].id,
    decision: "approve",
  });
  assert.equal(approved.data.run.approvals[0].status, "approved");
  assert.match(approved.data.run.explanation, /No money/);
  await assert.rejects(
    execute({
      action: "approve",
      envelope: approved.data,
      approvalId: approved.data.run.approvals[0].id,
      decision: "approve",
    }),
  );
});
test("restaurant repair preserves all unrelated days and activity IDs", async () => {
  const { data } = await generate();
  const result = await execute({
    action: "chaos",
    kind: "restaurant_closed",
    envelope: data,
  });
  assert.equal(
    result.data.run.itinerary.days[0].activities[0].title,
    "Alternative lunch",
  );
  assert.deepEqual(
    result.data.run.itinerary.days.slice(1),
    data.run.itinerary.days.slice(1),
  );
  assert.deepEqual(result.data.run.revisions.at(-1)?.changedActivityIds, [
    "day-1-visit",
  ]);
});
test("timeout recovery does not invent a cache when none exists", async () => {
  const { data } = await generate();
  const result = await execute({
    action: "chaos",
    kind: "api_timeout",
    envelope: data,
  });
  assert.equal(
    result.data.run.trace.filter((e) => e.action === "retry.backoff").length,
    2,
  );
  assert.ok(
    result.data.run.trace.some(
      (e) => e.action === "routes.cache" && e.status === "warning",
    ),
  );
});
test("evaluator fails over-budget plans but marks external unknowns honestly", () => {
  const result = evaluate(validItinerary(), { ...preferences, budget: 1 });
  assert.equal(result.passed, false);
  assert.equal(
    result.checks.find((c) => c.name === "Travel budget")?.status,
    "fail",
  );
  assert.equal(
    result.checks.find((c) => c.name === "Dietary suitability")?.status,
    "unknown",
  );
});
test("runtime rejects invalid input and oversized body", async () => {
  const response = await runtimeHandler(
    new Request("http://test/api/runtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x: "x".repeat(500001) }),
    }),
  );
  assert.equal(response.status, 413);
  await assert.rejects(executeRuntime({ action: "arbitrary" }, () => {}));
});
test("runtime model budget blocks before provider execution", async () => {
  const { data } = await generate();
  const run: TripRun = { ...data.run, executionBudget: 0, executionCost: 0 };
  let called = false;
  const provider = new RuntimeModels(
    run,
    () => {},
    async () => {
      called = true;
      throw new Error();
    },
  ).provider("Planner");
  await assert.rejects(
    provider.generateStructuredOutput({
      schema: z.object({ ok: z.boolean() }),
      schemaName: "test",
      input: "test",
      instructions: "test",
    }),
  );
  assert.equal(called, false);
});
test("model chaos actually falls back and accounts for token cost", async () => {
  const { data } = await generate();
  const events: TraceEvent[] = [];
  let calls = 0;
  const provider = new RuntimeModels(
    data.run,
    (e) => events.push(e),
    async () => {
      calls++;
      return Response.json({
        id: "resp_test",
        object: "response",
        status: "completed",
        usage: { input_tokens: 100, output_tokens: 10, total_tokens: 110 },
        output: [
          {
            id: "msg",
            type: "message",
            role: "assistant",
            status: "completed",
            content: [
              { type: "output_text", text: '{"ok":true}', annotations: [] },
            ],
          },
        ],
      });
    },
  ).provider("Planner", "simple", true);
  assert.deepEqual(
    await provider.generateStructuredOutput({
      schema: z.object({ ok: z.boolean() }),
      schemaName: "test",
      input: "test",
      instructions: "test",
    }),
    { ok: true },
  );
  assert.equal(calls, 1);
  assert.equal(events.filter((e) => e.action === "model.failure").length, 1);
  assert.ok(data.run.executionCost > 0);
});

test("adapter changes only selected day after resume time, streams and signs revision", async () => {
  const { data } = await generate();
  const original = structuredClone(data);
  const deps: RuntimeDependencies = {
    ...dependencies,
    models: () => ({
      provider: (agent) => {
        assert.equal(agent, "Adapter");
        return {
          generateStructuredOutput: async (r) => {
            assert.equal(r.schemaName, "day_adaptation");
            const request = JSON.parse(r.input);
            return {
              summary: "Recovered afternoon",
              explanation:
                "Moved the missed visit to the afternoon. Confirm availability.",
              activities: request.remaining.map(
                (a: Record<string, unknown>) => ({
                  ...a,
                  startTime:
                    String(
                      Number(String(a.startTime).slice(0, 2)) + 3,
                    ).padStart(2, "0") + String(a.startTime).slice(2),
                  endTime:
                    String(Number(String(a.endTime).slice(0, 2)) + 3).padStart(
                      2,
                      "0",
                    ) + String(a.endTime).slice(2),
                  title: "Afternoon alternative",
                }),
              ),
            };
          },
        };
      },
    }),
  };
  const { data: result, events } = await execute(
    {
      action: "adapt",
      envelope: data,
      date: "2026-09-21",
      resumeAt: "11:00",
      message: "I missed my train and will arrive at 13:00.",
    },
    deps,
  );
  assert.equal(result.run.version, 2);
  assert.deepEqual(result.run.itinerary.days[0], data.run.itinerary.days[0]);
  assert.deepEqual(
    result.run.itinerary.days.slice(2),
    data.run.itinerary.days.slice(2),
  );
  assert.ok(
    result.run.itinerary.days[1].activities.some(
      (a) => a.title === "Afternoon alternative",
    ),
  );
  assert.ok(
    events.some((e) => e.type === "trace" && e.event.agent === "Adapter"),
  );
  assert.deepEqual(unseal(result).itinerary, result.run.itinerary);
  assert.deepEqual(data, original);
});
test("adapter preserves completed activities and rejects malformed or backdated repairs", async () => {
  const { data } = await generate();
  const first = data.run.itinerary.days[0].activities[0];
  const later = {
    ...first,
    id: "afternoon",
    startTime: "21:00",
    endTime: "21:45",
  };
  data.run.itinerary.days[0].activities.push(later);
  data.run.itinerary.days[0].estimatedDailyCost += later.estimatedCost;
  data.run.itinerary.totalEstimatedCost += later.estimatedCost;
  const envelope = seal(data.run);
  const payload = {
    action: "adapt",
    envelope,
    date: "2026-09-20",
    resumeAt: "20:00",
    message: "My reservation was missed. Find another place.",
  };
  const model = (activities: unknown[]) => ({
    ...dependencies,
    models: () => ({
      provider: () => ({
        generateStructuredOutput: async () => ({
          summary: "Adjusted day",
          explanation: "Changed lunch",
          activities,
        }),
      }),
    }),
  });
  const result = await execute(
    payload,
    model([{ ...later, title: "New lunch" }]),
  );
  assert.deepEqual(result.data.run.itinerary.days[0].activities[0], first);
  await assert.rejects(
    execute(
      payload,
      model([{ ...later, startTime: "12:00", endTime: "14:00" }]),
    ),
    /failed validation/,
  );
  await assert.rejects(
    execute(payload, model([{ ...later, durationMinutes: 15 }])),
    /failed validation/,
  );
  await assert.rejects(execute(payload, model([later])), /no changes/);
  await assert.rejects(
    execute({ ...payload, date: "2026-10-01" }, model([later])),
    /Select a day/,
  );
  await assert.rejects(
    execute({ ...payload, resumeAt: "23:00" }, model([later])),
    /No activities remain/,
  );
});
test("adapter rejects modified signed state and blank prompts", async () => {
  const { data } = await generate();
  await assert.rejects(
    execute({
      action: "adapt",
      envelope: data,
      date: "2026-09-20",
      resumeAt: "09:00",
      message: "   ",
    }),
  );
  data.run.preferences.budget = 100000;
  await assert.rejects(
    execute({
      action: "adapt",
      envelope: data,
      date: "2026-09-20",
      resumeAt: "09:00",
      message: "I missed my train",
    }),
    /modified outside/,
  );
});
