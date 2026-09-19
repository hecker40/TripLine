import { readiness } from "../server/runtime/readiness";
const status = await readiness(true);
console.log(`${status.ready ? "READY" : "NOT READY"}: ${status.message}`);
console.log(
  `Engine: ${status.engine}; model: ${status.model}. No credentials are displayed.`,
);
process.exitCode = status.ready ? 0 : 1;
