import { executeRuntime, type RuntimeDependencies } from "../runtime/engine";
import { readiness } from "../runtime/readiness";
import { readJson } from "./generate";
import { AppError, safeError } from "../errors";
import type { RuntimeMessage } from "../../shared/runtime";

export async function runtimeHandler(
  request: Request,
  dependencies: RuntimeDependencies = {},
): Promise<Response> {
  const headers = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (request.method === "GET")
    return Response.json(
      await readiness(new URL(request.url).searchParams.get("verify") === "1"),
      { headers },
    );
  if (request.method !== "POST")
    return Response.json(
      { error: { code: "METHOD_NOT_ALLOWED", message: "Use GET or POST." } },
      { status: 405, headers },
    );
  let input: unknown;
  try {
    input = await readJson(request, 500_000);
  } catch (error) {
    const e = safeError(error);
    return Response.json(
      { error: { code: e.code, message: e.message } },
      { status: e.status, headers },
    );
  }
  const encoder = new TextEncoder();
  let active = true;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: RuntimeMessage) => {
        if (active)
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      try {
        await executeRuntime(input, send, dependencies);
      } catch (error) {
        const e =
          error instanceof AppError
            ? error
            : new AppError(
                "RUNTIME_FAILED",
                "The run could not complete. Your last successful trip is preserved.",
                500,
              );
        console.error("[runtime]", { code: e.code, status: e.status });
        send({ type: "error", code: e.code, message: e.message });
      } finally {
        if (active) controller.close();
      }
    },
    cancel() {
      active = false;
    },
  });
  return new Response(stream, {
    headers: {
      ...headers,
      "Content-Type": "application/x-ndjson",
      "X-Accel-Buffering": "no",
    },
  });
}
