import { TrueForge } from "@truefoundry/trueforge-sdk";
import { getAIConfig } from "../server/config";

const url = process.env.TRUEFORGE_BASE_URL || "http://127.0.0.1:8790";
const host = new URL(url).hostname;
if (
  !["127.0.0.1", "localhost", "::1"].includes(host) &&
  process.env.TRUEFORGE_ALLOW_REMOTE_SETUP !== "1"
) {
  console.error(
    "For a hosted harness, configure its OpenAI provider in TrueForge Settings. Remote credential provisioning requires TRUEFORGE_ALLOW_REMOTE_SETUP=1.",
  );
  process.exit(1);
}
try {
  const client = new TrueForge({
    baseUrl: url,
    token: process.env.TRUEFORGE_TOKEN || undefined,
    timeoutInSeconds: 30,
  });
  await client.settings.modelProviders.createOrUpdate({
    manifest: {
      type: "openai",
      auth: { apiKey: getAIConfig().apiKey },
      models: ["gpt-4o-mini", "gpt-4.1-mini"].map((model) => ({
        name: model.replaceAll(".", "-"),
        modelId: model,
        properties: { contextLength: 128000, maxOutputTokens: 16000 },
      })),
    },
  });
  console.log(
    "TrueForge OpenAI provider configured. Credentials were not printed. Set TRAVELOS_ENGINE=trueforge and TRUEFORGE_BASE_URL in the app environment.",
  );
} catch {
  console.error(
    "TrueForge setup failed. Confirm the harness is running, reachable, and the site key is configured.",
  );
  process.exit(1);
}
