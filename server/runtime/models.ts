import { z } from "zod";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type {
  AIProvider,
  StructuredOutputRequest,
} from "../providers/ai-provider";
import { getAIConfig } from "../config";
import { AppError } from "../errors";
import type { AgentName, TraceEvent, TripRun } from "../../shared/runtime";
import { randomUUID } from "node:crypto";
import { TrueForgeProvider } from "./trueforge";

export type Emit = (event: TraceEvent) => void;
export const prices: Record<string, [number, number]> = {
  "gpt-4o-mini": [0.15, 0.6],
  "gpt-4.1-mini": [0.4, 1.6],
};
export class RuntimeModels {
  constructor(
    private readonly run: TripRun,
    private readonly emit: Emit,
    private readonly transport?: typeof fetch,
  ) {}
  provider(
    agent: AgentName,
    complexity: "simple" | "complex" = "simple",
    simulateFailure = false,
  ): AIProvider {
    const primary =
      complexity === "complex"
        ? process.env.TRAVELOS_REASONING_MODEL || "gpt-4.1-mini"
        : getAIConfig().model;
    return {
      generateStructuredOutput: async <T>(
        request: StructuredOutputRequest<T>,
      ): Promise<unknown> => {
        const fallback = process.env.TRAVELOS_FALLBACK_MODEL || "gpt-4.1-mini";
        const candidates = [...new Set([primary, fallback])];
        for (let attempt = 0; attempt < candidates.length; attempt++) {
          const model = candidates[attempt];
          const tariff = prices[model];
          if (!tariff)
            throw new AppError(
              "UNKNOWN_MODEL_PRICE",
              `Cost controls require a configured tariff for model ${model}.`,
              503,
            );
          const inputEstimate =
            Math.ceil(
              (request.input.length +
                request.instructions.length +
                JSON.stringify(z.toJSONSchema(request.schema)).length) /
                2,
            ) + 2000;
          const reserved =
            (inputEstimate * tariff[0] + 12000 * tariff[1]) / 1_000_000;
          if (this.run.executionCost + reserved > this.run.executionBudget)
            throw new AppError(
              "EXECUTION_BUDGET_EXCEEDED",
              "The next model call would exceed this run’s AI budget.",
              409,
            );
          const start = Date.now();
          this.emit({
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            agent,
            action: "model.route",
            status: "running",
            model,
            detail: `${attempt ? "Fallback after failure" : complexity === "complex" ? "Cross-constraint repair needs stronger reasoning" : "Structured planning / evaluation"} · reserve $${reserved.toFixed(4)}`,
          });
          try {
            if (simulateFailure && attempt === 0)
              throw new AppError(
                "SIMULATED_MODEL_FAILURE",
                "Chaos: primary model failure injected before the network request.",
                503,
              );
            let output: unknown;
            let inputTokens = 0,
              outputTokens = 0,
              billed = 0;
            if (this.run.engine === "trueforge") {
              // Harness usage is conservatively charged at reservation when unavailable.
              output = await new TrueForgeProvider(model, (e) =>
                this.emit(e),
              ).generateStructuredOutput(request);
              billed = reserved;
            } else {
              const client = new OpenAI({
                apiKey: getAIConfig().apiKey,
                baseURL: "https://api.openai.com/v1",
                organization: null,
                project: null,
                maxRetries: 0,
                timeout: 70_000,
                fetch: this.transport,
              });
              const response = await client.responses.parse({
                model,
                store: false,
                instructions: request.instructions,
                input: request.input,
                max_output_tokens: 12000,
                text: {
                  format: zodTextFormat(request.schema, request.schemaName),
                },
              });
              inputTokens = response.usage?.input_tokens || 0;
              outputTokens = response.usage?.output_tokens || 0;
              billed = response.usage
                ? (inputTokens * tariff[0] + outputTokens * tariff[1]) /
                  1_000_000
                : reserved;
              this.run.executionCost += billed;
              if (response.status !== "completed" || !response.output_parsed)
                throw new AppError(
                  "INVALID_AI_OUTPUT",
                  "Model did not complete structured output.",
                  502,
                );
              output = response.output_parsed;
            }
            if (this.run.engine === "trueforge")
              this.run.executionCost += billed;
            this.emit({
              id: randomUUID(),
              timestamp: new Date().toISOString(),
              agent,
              action: "model.complete",
              status: "success",
              model,
              inputTokens,
              outputTokens,
              cost: billed,
              durationMs: Date.now() - start,
              detail:
                this.run.engine === "trueforge"
                  ? "TrueForge session completed; conservative reserved cost."
                  : "Validated structured model response; token-based estimated cost.",
            });
            return output;
          } catch (error) {
            if (error instanceof OpenAI.APIError && error.status === 401)
              throw new AppError(
                "AI_AUTHENTICATION_FAILED",
                "OpenAI rejected the site API key. Update it in this deployment’s environment.",
                503,
              );
            // Reserve the upper estimate on ambiguous failures; the request may have been billed.
            if (
              !(
                error instanceof AppError &&
                error.code === "SIMULATED_MODEL_FAILURE"
              )
            )
              this.run.executionCost += reserved;
            this.emit({
              id: randomUUID(),
              timestamp: new Date().toISOString(),
              agent,
              action: "model.failure",
              status: "failed",
              model,
              durationMs: Date.now() - start,
              detail:
                error instanceof AppError
                  ? error.message
                  : "Model unavailable; safe fallback requested.",
            });
            if (attempt === candidates.length - 1)
              throw new AppError(
                "MODEL_UNAVAILABLE",
                "The configured models could not complete the request. Retry or check server configuration.",
                502,
              );
          }
        }
        throw new AppError("MODEL_UNAVAILABLE", "No model available.", 502);
      },
    };
  }
}
