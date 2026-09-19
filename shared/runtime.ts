import { z } from "zod";
import type { Itinerary } from "./itinerary";
import type { TripPreferences } from "./preferences";
import type { TripStrategy } from "./planning";
import type { StaySearch } from "./booking";

export type AgentName =
  "Runtime" | "Planner" | "Research" | "Critic" | "Adapter" | "Policy";
export type TraceStatus =
  "running" | "success" | "warning" | "failed" | "blocked" | "approval";
export interface TraceEvent {
  dayIndex?: number;
  dayCount?: number;
  date?: string;
  id: string;
  timestamp: string;
  agent: AgentName;
  action: string;
  status: TraceStatus;
  detail: string;
  durationMs?: number;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
}
export interface Check {
  name: string;
  status: "pass" | "fail" | "unknown";
  detail: string;
}
export interface Evaluation {
  score: number;
  passed: boolean;
  checks: Check[];
  feedback: string;
}
export interface Approval {
  id: string;
  title: string;
  amount: number;
  status: "pending" | "approved" | "denied";
  simulation: true;
}
export interface Revision {
  version: number;
  reason: string;
  cost: number;
  score: number;
  changedActivityIds: string[];
}
export interface Research {
  name: string;
  latitude: number;
  longitude: number;
  source: string;
  weather: string | null;
}
export interface RouteEstimate {
  from: string;
  to: string;
  distanceKm: number | null;
  walkingMinutes: number | null;
  travelMinutes?: number;
  source: "straight-line estimate" | "planner transit estimate";
}
export interface TripRun {
  booking?: StaySearch;
  planning?: TripStrategy;
  id: string;
  createdAt: string;
  version: number;
  preferences: TripPreferences;
  itinerary: Itinerary;
  evaluation: Evaluation;
  trace: TraceEvent[];
  approvals: Approval[];
  revisions: Revision[];
  research: Research | null;
  routes: RouteEstimate[];
  executionBudget: number;
  executionCost: number;
  engine: "openai" | "trueforge";
  status: "ready" | "needs_attention";
  explanation: string;
}
export interface RunEnvelope {
  run: TripRun;
  proof: string;
}
export type RuntimeMessage =
  | { type: "trace"; event: TraceEvent }
  | { type: "result"; data: RunEnvelope }
  | { type: "error"; code: string; message: string };
export interface Readiness {
  bookingConfigured?: boolean;
  ready: boolean;
  keyConfigured: boolean;
  engine: "openai" | "trueforge";
  model: string;
  harnessConfigured: boolean;
  message: string;
}
export const chaosKinds = [
  "hotel_price",
  "restaurant_closed",
  "api_timeout",
  "model_failure",
  "budget_cut",
  "unauthorized_tool",
  "booking_request",
  "rain",
] as const;
export type ChaosKind = (typeof chaosKinds)[number];
export const runtimeRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("search_stays"),
    envelope: z.unknown(),
    rooms: z.number().int().min(1).max(12),
    country: z.string().regex(/^[a-z]{2}$/),
  }),
  z.object({
    action: z.literal("adapt"),
    envelope: z.unknown(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    resumeAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    message: z.string().trim().min(5).max(1500),
  }),
  z.object({
    action: z.literal("generate"),
    preferences: z.unknown(),
    executionBudget: z.number().min(0.1).max(5).default(0.5),
    wakeUpTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .default("09:00"),
    maxWalkingMinutes: z.number().min(5).max(120).default(20),
  }),
  z.object({
    action: z.literal("chaos"),
    envelope: z.unknown(),
    kind: z.enum(chaosKinds),
  }),
  z.object({
    action: z.literal("approve"),
    envelope: z.unknown(),
    approvalId: z.string().max(100),
    decision: z.enum(["approve", "deny"]),
  }),
]);
