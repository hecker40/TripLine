import { randomUUID } from "node:crypto";
import { z } from "zod";
import { PlannerAgent } from "../agents/planner-agent";
import { AppError } from "../errors";
import { activitySchema, type Itinerary } from "../../shared/itinerary";
import {
  tripPreferencesSchema,
  type TripPreferences,
} from "../../shared/preferences";
import {
  runtimeRequestSchema,
  type AgentName,
  type ChaosKind,
  type RuntimeMessage,
  type TripRun,
} from "../../shared/runtime";
import { evaluate, recalculate } from "./evaluate";
import {
  estimateRoutes,
  assertPermission,
  researchDestination,
  researchWeather,
} from "./tools";
import { RuntimeModels, type Emit } from "./models";
import { seal, unseal } from "./state";

export interface RuntimeDependencies {
  models?: (run: TripRun, emit: Emit) => Pick<RuntimeModels, "provider">;
  research?: typeof researchDestination;
  weather?: typeof researchWeather;
}
export async function executeRuntime(
  input: unknown,
  send: (event: RuntimeMessage) => void,
  dependencies: RuntimeDependencies = {},
): Promise<void> {
  const parsed = runtimeRequestSchema.safeParse(input);
  if (!parsed.success)
    throw new AppError(
      "INVALID_REQUEST",
      "Check the trip and runtime settings.",
      400,
    );
  const request = parsed.data;
  let run: TripRun;
  if (request.action === "generate") {
    const p = tripPreferencesSchema.safeParse(request.preferences);
    if (!p.success)
      throw new AppError(
        "INVALID_PREFERENCES",
        "Check the destination, dates, travelers and budget.",
        400,
      );
    const preferences: TripPreferences = {
      ...p.data,
      additionalPreferences:
        `${p.data.additionalPreferences.replace(/\nWake-up not before[\s\S]*$/, "")}\nWake-up not before ${request.wakeUpTime}. Maximum walking ${request.maxWalkingMinutes} minutes between activities.`.slice(
          0,
          2000,
        ),
    };
    run = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      version: 1,
      preferences,
      itinerary: null as unknown as Itinerary,
      evaluation: { score: 0, passed: false, checks: [], feedback: "" },
      trace: [],
      approvals: [],
      revisions: [],
      research: null,
      routes: [],
      executionBudget: request.executionBudget,
      executionCost: 0,
      engine:
        process.env.TRAVELOS_ENGINE === "trueforge" ? "trueforge" : "openai",
      status: "needs_attention",
      explanation: "",
    };
  } else run = unseal(request.envelope);
  const emit = (event: TripRun["trace"][number]) => {
    run.trace.push(event);
    run.trace = run.trace.slice(-180);
    send({ type: "trace", event });
  };
  const trace = (
    agent: AgentName,
    action: string,
    status: TripRun["trace"][number]["status"],
    detail: string,
    durationMs?: number,
  ) =>
    emit({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      agent,
      action,
      status,
      detail,
      durationMs,
    });
  const models =
    dependencies.models?.(run, emit) || new RuntimeModels(run, emit);
  const tool = async <T>(
    agent: AgentName,
    name: string,
    call: () => Promise<T> | T,
  ): Promise<T> => {
    assertPermission(agent, name);
    const start = Date.now();
    trace(agent, name, "running", "Capability allowed; execution started.");
    try {
      const result = await call();
      trace(agent, name, "success", "Tool completed.", Date.now() - start);
      return result;
    } catch (e) {
      trace(
        agent,
        name,
        "failed",
        "Tool failed; no result was fabricated.",
        Date.now() - start,
      );
      throw e;
    }
  };
  const check = () => {
    run.routes = estimateRoutes(run.itinerary);
    run.evaluation = evaluate(run.itinerary, run.preferences, run.routes);
    trace(
      "Critic",
      "constraints.evaluate",
      run.evaluation.passed ? "success" : "warning",
      run.evaluation.checks
        .filter((c) => c.status === "fail")
        .map((c) => `${c.name}: ${c.detail}`)
        .join(" ") ||
        `Known constraints pass. ${run.evaluation.checks.filter((c) => c.status === "unknown").length} checks are unverified.`,
    );
    run.status = run.evaluation.passed ? "ready" : "needs_attention";
  };
  const plan = async (repair = false) => {
    const preferences = repair
      ? {
          ...run.preferences,
          additionalPreferences: `${run.preferences.additionalPreferences}\nRepair these constraints: ${run.evaluation.checks
            .filter((c) => c.status === "fail")
            .map((c) => c.detail)
            .join(
              " ",
            )}. Propose cheaper realistic alternatives; explicitly warn if impossible.`,
        }
      : run.preferences;
    try {
      run.itinerary = await new PlannerAgent(
        models.provider("Planner", repair ? "complex" : "simple"),
      ).generateItinerary(preferences);
    } catch (error) {
      if (!(error instanceof AppError) || error.code !== "INVALID_AI_OUTPUT")
        throw error;
      trace(
        "Planner",
        "output.retry",
        "warning",
        "Structured validation failed. One bounded retry with the repair model.",
      );
      run.itinerary = await new PlannerAgent(
        models.provider("Planner", "complex"),
      ).generateItinerary(preferences);
    }
    trace(
      "Planner",
      "itinerary.update",
      "success",
      `${run.itinerary.days.length} days generated and structurally validated.`,
    );
  };
  let reason = "Initial plan",
    changed: string[] = [];
  if (request.action === "generate") {
    trace(
      "Runtime",
      "run.start",
      "running",
      `${run.engine === "trueforge" ? "TrueForge SDK" : "Direct OpenAI"} · $${run.executionBudget.toFixed(2)} execution ceiling.`,
    );
    try {
      run.research = await tool("Research", "places.search", () =>
        (dependencies.research || researchDestination)(
          run.preferences.destination,
        ),
      );
      if (run.research) {
        const place = run.research;
        try {
          place.weather = await tool("Research", "weather.forecast", () =>
            (dependencies.weather || researchWeather)(
              place,
              run.preferences.startDate,
            ),
          );
        } catch {
          place.weather =
            "Forecast unavailable; plan uses no weather assumption.";
        }
      }
    } catch {
      trace(
        "Research",
        "research.fallback",
        "warning",
        "Live geographic lookup unavailable. Continue with explicitly unverified model suggestions.",
      );
    }
    await plan();
    await tool("Planner", "routes.estimate", () => {
      run.routes = estimateRoutes(run.itinerary);
      return run.routes;
    });
    check();
    if (!run.evaluation.passed) {
      trace(
        "Runtime",
        "repair.start",
        "warning",
        "Known constraints failed; bounded repair (1 of 1).",
      );
      await plan(true);
      check();
      reason = "Initial plan repaired";
    }
    try {
      const criticSchema = z.object({
        summary: z.string().max(1200),
        preferenceFit: z.number().min(0).max(100),
        concerns: z.array(z.string().max(250)).max(5),
      });
      const critique = criticSchema.parse(
        await models
          .provider("Critic")
          .generateStructuredOutput({
            schema: criticSchema,
            schemaName: "travel_critique",
            instructions:
              "Assess preference fit and practical quality. Do not claim to verify live opening hours, reservations or routes. Be concise. Report concerns honestly.",
            input: JSON.stringify({
              preferences: run.preferences,
              itinerary: run.itinerary,
              checks: run.evaluation.checks,
            }),
          }),
      );
      run.evaluation.feedback = critique.summary;
      trace(
        "Critic",
        "preferences.review",
        "success",
        `Preference fit ${critique.preferenceFit}/100. ${critique.concerns.join(" ") || critique.summary}`,
      );
    } catch {
      trace(
        "Critic",
        "review.unavailable",
        "warning",
        "Subjective review unavailable. Deterministic checks retained.",
      );
    }
    run.explanation = run.evaluation.passed
      ? "Your trip is ready to inspect. Live geography and forecasts are separated from proposed venues and estimated routes."
      : "A proposal is available, but some constraints need your attention. No bookings were made.";
  } else if (request.action === "approve") {
    const approval = run.approvals.find((a) => a.id === request.approvalId);
    if (!approval || approval.status !== "pending")
      throw new AppError(
        "APPROVAL_NOT_PENDING",
        "This request is no longer pending.",
        409,
      );
    approval.status = request.decision === "approve" ? "approved" : "denied";
    trace(
      "Policy",
      "approval.decision",
      request.decision === "approve" ? "success" : "blocked",
      `${approval.title}: ${approval.status}. Simulation only; no booking or payment executed.`,
    );
    run.explanation = `You ${approval.status} the demonstration request. No money was spent and no reservation was made.`;
    reason = "Human decision";
  } else {
    reason = `Chaos: ${request.kind}`;
    trace(
      "Runtime",
      "chaos.inject",
      "warning",
      `Controlled simulation: ${request.kind}. This is not a reported real-world disruption.`,
    );
    if (request.kind === "unauthorized_tool") {
      try {
        assertPermission("Planner", "hotel.cancel");
      } catch {
        trace(
          "Policy",
          "hotel.cancel",
          "blocked",
          "Planner lacks cancellation permission. No cancellation executed. Approval cannot override this capability boundary.",
        );
      }
      run.explanation =
        "The runtime blocked the unauthorized cancellation before execution.";
    } else if (request.kind === "booking_request") {
      assertPermission("Runtime", "booking.request");
      const restaurant = run.itinerary.days
        .flatMap((d) => d.activities)
        .find((a) => a.category === "restaurant");
      if (!restaurant)
        throw new AppError(
          "NO_RESTAURANT",
          "No restaurant exists in this plan.",
          409,
        );
      if (run.approvals.some((a) => a.status === "pending"))
        throw new AppError(
          "APPROVAL_PENDING",
          "Resolve the existing approval first.",
          409,
        );
      run.approvals.push({
        id: randomUUID(),
        title: `Reserve ${restaurant.title}`,
        amount: restaurant.estimatedCost,
        status: "pending",
        simulation: true,
      });
      trace(
        "Policy",
        "booking.request",
        "approval",
        "Human approval required. Demo request only; no booking adapter is connected.",
      );
      run.explanation =
        "A simulated reservation request is awaiting your decision.";
    } else if (request.kind === "api_timeout") {
      for (let n = 0; n < 3; n++) {
        trace(
          "Research",
          "routes.estimate",
          "failed",
          `Injected timeout: attempt ${n + 1}/3.`,
        );
        if (n < 2) {
          trace(
            "Runtime",
            "retry.backoff",
            "warning",
            `Waiting ${200 * 2 ** n}ms before retry.`,
          );
          await new Promise((r) => setTimeout(r, 200 * 2 ** n));
        }
      }
      const cached = run.routes;
      if (cached.length) {
        trace(
          "Research",
          "routes.cache",
          "success",
          `${cached.length} previously computed estimates recovered from signed trip state. Not live transit directions.`,
        );
        run.explanation =
          "Route estimation recovered from this trip’s cached estimates after two retries.";
      } else {
        trace(
          "Research",
          "routes.cache",
          "warning",
          "No route coordinates were available; route status remains unknown.",
        );
        run.explanation =
          "No cached route was available. Your itinerary is retained; route feasibility still needs checking.";
      }
    } else if (request.kind === "model_failure") {
      const schema = z.object({ summary: z.string() });
      const result = schema.parse(
        await models
          .provider("Planner", "simple", true)
          .generateStructuredOutput({
            schema,
            schemaName: "recovery_summary",
            instructions:
              "Briefly summarize why preserving an existing itinerary during model failure is useful.",
            input: run.itinerary.title,
          }),
      );
      run.explanation = `Fallback model completed successfully. ${result.summary}`;
    } else if (request.kind === "budget_cut") {
      run.preferences.budget = Math.round(run.preferences.budget * 0.75);
      check();
      trace(
        "Planner",
        "repair.scope",
        "warning",
        "Budget changed by this simulation; all cost-bearing activities may be affected.",
      );
      await plan(true);
      check();
      changed = run.itinerary.days.flatMap((d) =>
        d.activities.map((a) => a.id),
      );
      run.explanation = `Simulation reduced the budget to $${run.preferences.budget}. The planner rebuilt affected costs and re-evaluated the trip.`;
    } else {
      changed = await repairActivity(run, request.kind, models, trace);
      check();
    }
    run.version++;
  }
  if (request.action !== "approve")
    run.revisions.push({
      version: run.version,
      reason,
      cost: run.itinerary.totalEstimatedCost,
      score: run.evaluation.score,
      changedActivityIds: changed,
    });
  run.revisions = run.revisions.slice(-12);
  trace(
    "Runtime",
    "run.complete",
    run.status === "ready" ? "success" : "warning",
    run.explanation,
  );
  send({ type: "result", data: seal(run) });
}

async function repairActivity(
  run: TripRun,
  kind: ChaosKind,
  models: Pick<RuntimeModels, "provider">,
  trace: (
    agent: AgentName,
    action: string,
    status: TripRun["trace"][number]["status"],
    detail: string,
  ) => void,
): Promise<string[]> {
  const category =
    kind === "hotel_price"
      ? "hotel"
      : kind === "restaurant_closed"
        ? "restaurant"
        : "activity";
  const day = run.itinerary.days.find((d) =>
    d.activities.some((a) => a.category === category),
  );
  const original = day?.activities.find((a) => a.category === category);
  if (!day || !original)
    throw new AppError(
      "NO_TARGET",
      `This itinerary has no ${category} to disrupt.`,
      409,
    );
  const before = structuredClone(original);
  if (kind === "hotel_price") {
    original.estimatedCost += Math.max(
      270,
      run.preferences.budget - run.itinerary.totalEstimatedCost + 100,
    );
    run.itinerary = recalculate(run.itinerary);
  }
  const observedCost = original.estimatedCost;
  const cap = Math.max(
    0,
    run.preferences.budget -
      (run.itinerary.totalEstimatedCost - original.estimatedCost),
  );
  trace(
    "Critic",
    "disruption.detected",
    "failed",
    kind === "hotel_price"
      ? `Nightly stay estimate changed from $${before.estimatedCost} to $${observedCost}; budget exceeded.`
      : `${original.title} marked unavailable by simulation.`,
  );
  trace(
    "Planner",
    "repair.scope",
    "running",
    `Replace one ${category}; preserve its time slot and every unaffected activity.`,
  );
  const schema = activitySchema.extend({
    id: z.literal(original.id),
    category: z.literal(original.category),
    startTime: z.literal(original.startTime),
    endTime: z.literal(original.endTime),
    durationMinutes: z.literal(original.durationMinutes),
    estimatedCost: z.number().min(0).max(cap),
  });
  const replacement = schema.parse(
    await models
      .provider("Planner", "complex")
      .generateStructuredOutput({
        schema,
        schemaName: "activity_repair",
        instructions:
          "Replace only the supplied activity with a different realistic nearby alternative. Preserve the exact id, category, startTime, endTime and duration. Respect party budget, diet and preferences. Use estimated party costs; never claim live verification or a booking. For rain choose an indoor venue. Keep times and unaffected activities unchanged.",
        input: JSON.stringify({
          reason: kind,
          preferences: run.preferences,
          original: before,
          day: day.date,
          maximumCost: cap,
          nearby: day.activities.map((a) => a.location.name),
        }),
      }),
  );
  if (
    replacement.title === before.title &&
    replacement.location.name === before.location.name
  )
    throw new AppError(
      "REPAIR_UNRESOLVED",
      "The planner did not find a different alternative. The previous itinerary is retained.",
      502,
    );
  run.itinerary = recalculate({
    ...run.itinerary,
    days: run.itinerary.days.map((d) => ({
      ...d,
      activities: d.activities.map((a) =>
        a.id === original.id ? replacement : a,
      ),
    })),
  });
  trace(
    "Planner",
    "itinerary.update",
    "success",
    `${before.title} → ${replacement.title}. Only one activity replaced; adjacent route estimates recomputed.`,
  );
  run.explanation = `${kind === "hotel_price" ? "A simulated price spike" : kind === "rain" ? "Simulated rain" : "A simulated closure"} affected ${before.title}. Replaced it with ${replacement.title}; all other activities were preserved. Availability still requires confirmation.`;
  return [original.id];
}
