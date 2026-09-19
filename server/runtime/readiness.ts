import { bookingConfigured as hasBooking } from "../integrations/booking-mcp";
import { getAIConfig } from "../config";
import type { Readiness } from "../../shared/runtime";

export async function readiness(verify = false): Promise<Readiness> {
  const engine =
    process.env.TRAVELOS_ENGINE === "trueforge" ? "trueforge" : "openai";
  const bookingConfigured = hasBooking();
  const harnessConfigured = Boolean(process.env.TRUEFORGE_BASE_URL);
  let model = process.env.TRAVELOS_OPENAI_MODEL || "gpt-4o-mini";
  try {
    const config = getAIConfig();
    model = config.model;
    if (engine === "trueforge" && !harnessConfigured)
      return {
        ready: false,
        keyConfigured: true,
        engine,
        model,
        harnessConfigured,
        bookingConfigured,
        message: "Set TRUEFORGE_BASE_URL, or use TRAVELOS_ENGINE=openai.",
      };
    if (verify && engine === "trueforge") {
      const url = new URL("/api/v1/models", process.env.TRUEFORGE_BASE_URL);
      const response = await fetch(url, {
        headers: process.env.TRUEFORGE_TOKEN
          ? { Authorization: `Bearer ${process.env.TRUEFORGE_TOKEN}` }
          : {},
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok)
        return {
          ready: false,
          keyConfigured: true,
          engine,
          model,
          harnessConfigured,
          bookingConfigured,
          message:
            "TrueForge is configured but unreachable or unauthorized. Check the harness URL and token.",
        };
    }
    if (verify && engine === "openai") {
      const result = await fetch(
        `https://api.openai.com/v1/models/${encodeURIComponent(model)}`,
        {
          headers: { Authorization: `Bearer ${config.apiKey}` },
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!result.ok)
        return {
          ready: false,
          keyConfigured: true,
          engine,
          model,
          harnessConfigured,
          bookingConfigured,
          message:
            result.status === 401
              ? "The deployed API key was rejected. Update TRAVELOS_OPENAI_API_KEY in Vercel and redeploy."
              : "The configured model is unavailable for this key. Check model access and billing.",
        };
    }
    return {
      ready: true,
      keyConfigured: true,
      engine,
      model,
      harnessConfigured,
      bookingConfigured,
      message:
        engine === "trueforge"
          ? verify
            ? "TrueForge connection verified. Model execution is checked when a session runs."
            : "TrueForge configured; verify the connection before starting."
          : verify
            ? "OpenAI authentication and model access verified."
            : "Site key configured. Run connection check to verify access.",
    };
  } catch {
    return {
      ready: false,
      keyConfigured: false,
      engine,
      model,
      harnessConfigured,
      bookingConfigured,
      message:
        "Deployment setup needed: set TRAVELOS_OPENAI_API_KEY in Vercel → Settings → Environment Variables, then redeploy. A Git push does not transfer local secrets.",
    };
  }
}
