import { createHmac, timingSafeEqual } from "node:crypto";
import { getAIConfig } from "../config";
import { AppError } from "../errors";
import type { TripRun, RunEnvelope } from "../../shared/runtime";

const digest = (run: TripRun) =>
  createHmac(
    "sha256",
    process.env.TRAVELOS_STATE_SECRET || getAIConfig().apiKey,
  )
    .update("travelos-v2:")
    .update(JSON.stringify(run))
    .digest("hex");
export function seal(run: TripRun): RunEnvelope {
  return { run, proof: digest(run) };
}
export function unseal(value: unknown): TripRun {
  if (
    !value ||
    typeof value !== "object" ||
    !("run" in value) ||
    !("proof" in value) ||
    typeof value.proof !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.proof)
  )
    throw new AppError(
      "INVALID_STATE",
      "This trip session is invalid. Generate a new trip.",
      400,
    );
  const run = value.run as TripRun;
  if (
    !run ||
    !timingSafeEqual(
      Buffer.from(value.proof, "hex"),
      Buffer.from(digest(run), "hex"),
    )
  )
    throw new AppError(
      "INVALID_STATE",
      "This trip was modified outside the runtime. Generate a new trip.",
      400,
    );
  if (
    Date.now() - Date.parse(run.createdAt) > 86_400_000 ||
    !Number.isFinite(Date.parse(run.createdAt))
  )
    throw new AppError(
      "SESSION_EXPIRED",
      "This demo session expired. Generate a new trip.",
      410,
    );
  return structuredClone(run);
}
