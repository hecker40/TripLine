import { readiness } from "../server/runtime/readiness";

// Fail the deployment, not the traveler's first request. Local builds remain key-free.
if (process.env.VERCEL === "1") {
  const status = await readiness(true);
  if (!status.ready) {
    console.error(`TravelOS deployment blocked: ${status.message}`);
    process.exitCode = 1;
  } else
    console.log(
      `TravelOS deployment preflight passed (${status.engine}). No credentials are exposed.`,
    );
}
