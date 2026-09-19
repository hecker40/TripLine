import { test } from "node:test";
import assert from "node:assert/strict";
import { mcpHandler } from "../server/routes/mcp";
async function call(method: string, params?: unknown) {
  return mcpHandler(
    new Request("http://test/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }),
  );
}
test("MCP initialization and discovery expose read-only travel tools", async () => {
  const initialized = await (await call("initialize")).json();
  assert.equal(initialized.result.serverInfo.name, "travelos-tools");
  const tools = await (await call("tools/list")).json();
  assert.deepEqual(
    tools.result.tools.map((t: { name: string }) => t.name),
    ["places.search", "routes.estimate"],
  );
});
test("MCP cannot execute cancellation or arbitrary tools", async () => {
  const response = await (
    await call("tools/call", { name: "hotel.cancel", arguments: {} })
  ).json();
  assert.equal(response.error.code, -32602);
});
test("MCP checks configured bearer token", async () => {
  const previous = process.env.TRAVELOS_MCP_TOKEN;
  process.env.TRAVELOS_MCP_TOKEN = "test-only";
  try {
    assert.equal((await call("initialize")).status, 401);
  } finally {
    if (previous === undefined) delete process.env.TRAVELOS_MCP_TOKEN;
    else process.env.TRAVELOS_MCP_TOKEN = previous;
  }
});
