import { useEffect, useRef, useState } from "react";
import type {
  ChaosKind,
  Readiness,
  RunEnvelope,
  RuntimeMessage,
  TraceEvent,
} from "../../shared/runtime";
import type { TripPreferences } from "../../shared/preferences";

export function useRuntime() {
  const [session, setSession] = useState<RunEnvelope | null>(null);
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [status, setStatus] = useState<Readiness | null>(null);
  const lock = useRef(false);
  const [settings, setSettings] = useState({
    executionBudget: 0.5,
    wakeUpTime: "09:00",
    maxWalkingMinutes: 20,
  });
  const last = useRef<unknown>(null);
  async function checkConnection(verify = false) {
    try {
      const r = await fetch(`/api/runtime${verify ? "?verify=1" : ""}`);
      if (!r.ok) throw new Error();
      setStatus((await r.json()) as Readiness);
    } catch {
      setStatus({
        ready: false,
        keyConfigured: false,
        engine: "openai",
        model: "",
        harnessConfigured: false,
        message:
          "The runtime API is unavailable. Deploy the latest repository with its api/ directory.",
      });
    }
  }
  useEffect(() => {
    void checkConnection(true);
  }, []);
  async function execute(payload: unknown, reset = false) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    last.current = payload;
    if (reset) setTrace([]);
    try {
      const response = await fetch("/api/runtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(280_000),
      });
      if (!response.ok || !response.body) {
        const json = await response.json().catch(() => null);
        throw new Error(
          json?.error?.message ||
            "Runtime endpoint unavailable. Check this deployment’s configuration.",
        );
      }
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let pending = "",
        finished = false;
      while (true) {
        const { done, value } = await reader.read();
        pending += decoder.decode(value, { stream: !done });
        const lines = pending.split("\n");
        pending = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as RuntimeMessage;
          if (event.type === "trace")
            setTrace((t) => [...t, event.event].slice(-180));
          if (event.type === "error") throw new Error(event.message);
          if (event.type === "result") {
            setSession(event.data);
            setTrace(event.data.run.trace);
            finished = true;
          }
        }
        if (done) break;
      }
      if (!finished)
        throw new Error(
          "The connection ended before a result arrived. Your previous trip is still available.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "The run could not complete.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return {
    session,
    trace,
    busy,
    error,
    status,
    settings,
    setSettings,
    checkConnection,
    generate: (preferences: TripPreferences) =>
      execute({ action: "generate", preferences, ...settings }, true),
    chaos: (kind: ChaosKind) =>
      execute({ action: "chaos", envelope: session, kind }),
    approve: (approvalId: string, decision: "approve" | "deny") =>
      execute({ action: "approve", envelope: session, approvalId, decision }),
    retry: () => (last.current ? execute(last.current) : Promise.resolve()),
  };
}
