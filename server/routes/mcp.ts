import { z } from "zod";
import { readJson } from "./generate";
import { itinerarySchema } from "../../shared/itinerary";
import {
  assertPermission,
  estimateRoutes,
  researchDestination,
} from "../runtime/tools";

const searchSchema = z.object({ destination: z.string().min(1).max(120) });
// A stateless, read-only MCP endpoint. Booking and payments are deliberately absent.
export async function mcpHandler(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  if (request.method !== "POST")
    return new Response(null, {
      status: 405,
      headers: { ...headers, Allow: "POST" },
    });
  if (
    process.env.TRAVELOS_MCP_TOKEN &&
    request.headers.get("authorization") !==
      `Bearer ${process.env.TRAVELOS_MCP_TOKEN}`
  )
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  let id: unknown = null;
  try {
    const message = z
      .object({
        jsonrpc: z.literal("2.0"),
        id: z.union([z.string(), z.number()]).optional(),
        method: z.string(),
        params: z.unknown().optional(),
      })
      .parse(await readJson(request, 150_000));
    id = message.id ?? null;
    if (message.id === undefined && message.method.startsWith("notifications/"))
      return new Response(null, { status: 202, headers });
    let result: unknown;
    if (message.method === "initialize")
      result = {
        protocolVersion: "2025-03-26",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "travelos-tools", version: "2.0.0" },
      };
    else if (message.method === "ping") result = {};
    else if (message.method === "tools/list")
      result = {
        tools: [
          {
            name: "places.search",
            description:
              "Live city geocoding via Open-Meteo. Not venue availability.",
            inputSchema: z.toJSONSchema(searchSchema),
            annotations: { readOnlyHint: true },
          },
          {
            name: "routes.estimate",
            description:
              "Straight-line distance and walking estimates for proposed itinerary coordinates. Not navigation directions.",
            inputSchema: z.toJSONSchema(
              z.object({ itinerary: itinerarySchema }),
            ),
            annotations: { readOnlyHint: true },
          },
        ],
      };
    else if (message.method === "tools/call") {
      const call = z
        .object({ name: z.string(), arguments: z.unknown() })
        .parse(message.params);
      assertPermission("Research", call.name);
      let value: unknown;
      if (call.name === "places.search")
        value = await researchDestination(
          searchSchema.parse(call.arguments).destination,
        );
      else if (call.name === "routes.estimate")
        value = estimateRoutes(
          z.object({ itinerary: itinerarySchema }).parse(call.arguments)
            .itinerary,
        );
      else throw new Error("Tool not exposed");
      result = {
        content: [{ type: "text", text: JSON.stringify(value) }],
        isError: false,
      };
    } else
      return Response.json(
        {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: "Method not found" },
        },
        { headers },
      );
    return Response.json({ jsonrpc: "2.0", id, result }, { headers });
  } catch {
    return Response.json(
      {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32602,
          message: "Invalid request or tool not permitted.",
        },
      },
      { headers },
    );
  }
}
