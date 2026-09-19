import { useEffect, useRef, useState } from "react";
import { dayMapSchema, type DayMap, type RouteMode } from "../../shared/maps";
import type { RunEnvelope } from "../../shared/runtime";

export function useDayMap(
  envelope: RunEnvelope,
  date: string,
  mode: RouteMode,
) {
  const cache = useRef(new Map<string, DayMap>());
  const key = `${envelope.run.id}:${envelope.run.version}:${date}:${mode}`;
  const latest = useRef(envelope);
  latest.current = envelope;
  const [state, setState] = useState<{
    key: string;
    data: DayMap | null;
    error: string;
    loading: boolean;
  }>({ key: "", data: null, error: "", loading: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const cached = cache.current.get(key);
    if (cached) {
      setState({ key, data: cached, error: "", loading: false });
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
    let active = true;
    setState({ key, data: null, error: "", loading: true });
    void (async () => {
      try {
        const response = await fetch("/api/maps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ envelope: latest.current, date, mode }),
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            "Route preview unavailable. Your itinerary is unchanged.",
          );
        const data = dayMapSchema.parse(await response.json());
        if (data.date !== date || data.mode !== mode)
          throw new Error("Route response did not match this day.");
        if (cache.current.size > 30) cache.current.clear();
        cache.current.set(key, data);
        if (active) setState({ key, data, error: "", loading: false });
      } catch {
        if (active)
          setState({
            key,
            data: null,
            error:
              "Route preview unavailable. Use the location links or retry.",
            loading: false,
          });
      } finally {
        clearTimeout(timeout);
      }
    })();
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [key, date, mode, attempt]);
  return {
    ...(state.key === key ? state : { data: null, error: "", loading: true }),
    retry: () => {
      cache.current.delete(key);
      setAttempt((n) => n + 1);
    },
  };
}
