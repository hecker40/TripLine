import { TrueForge } from "@truefoundry/trueforge-sdk";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import type {
  AIProvider,
  StructuredOutputRequest,
} from "../providers/ai-provider";
import type { TraceEvent } from "../../shared/runtime";
import { AppError } from "../errors";

export class TrueForgeProvider implements AIProvider {
  constructor(
    private readonly model: string,
    private readonly emit: (event: TraceEvent) => void,
  ) {}
  async generateStructuredOutput<T>(
    request: StructuredOutputRequest<T>,
  ): Promise<unknown> {
    const baseUrl = process.env.TRUEFORGE_BASE_URL;
    if (!baseUrl)
      throw new AppError(
        "HARNESS_NOT_CONFIGURED",
        "Set TRUEFORGE_BASE_URL to your running TrueForge server.",
        503,
      );
    const client = new TrueForge({
      baseUrl,
      token: process.env.TRUEFORGE_TOKEN || undefined,
      timeoutInSeconds: 80,
    });
    const { data: session } = await client.sessions.create({
      agent: {
        spec: {
          model: {
            name: `openai/${this.model.replaceAll(".", "-")}`,
            params: { maxTokens: 12000 },
          },
          instructions: request.instructions,
          responseFormat: {
            type: "json_schema",
            jsonSchema: {
              name: request.schemaName,
              strict: true,
              schema: z.toJSONSchema(request.schema),
            },
          },
          config: {
            iterationLimit: 2,
            sandbox: { enabled: false },
            dynamicSubAgents: { enabled: false },
            webSearch: { enabled: false },
            generativeUi: { enabled: false },
            askUserQuestions: { enabled: false },
          },
        },
      },
    });
    this.emit({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      agent: "Runtime",
      action: "trueforge.session",
      status: "success",
      detail: `Real harness session created: ${session.id}`,
    });
    const stream = await client.sessions.createTurnStream(session.id, {
      input: [{ type: "user.message", content: request.input }],
    });
    let text = "",
      complete = false;
    for await (const { data: event } of stream.withMetadata()) {
      if (event.type === "model.message.delta" && event.threadId === "main")
        text += event.content || "";
      if (event.type === "turn.done") {
        if (event.state.status !== "done" || event.state.requiredActions.length)
          throw new AppError(
            "HARNESS_INCOMPLETE",
            "TrueForge did not complete this planning turn.",
            502,
          );
        const content = event.state.output?.content;
        if (typeof content === "string") text = content;
        else if (Array.isArray(content))
          text = content
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("");
        complete = true;
      }
    }
    if (!complete)
      throw new AppError(
        "HARNESS_INCOMPLETE",
        "TrueForge stream ended without a completed turn.",
        502,
      );
    try {
      return request.schema.parse(JSON.parse(text));
    } catch {
      throw new AppError(
        "INVALID_AI_OUTPUT",
        "TrueForge returned invalid structured output.",
        502,
      );
    }
  }
}
