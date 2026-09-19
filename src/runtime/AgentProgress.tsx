import type { AgentName, TraceEvent } from "../../shared/runtime";
import { TraceList } from "./AgentOps";

const agents: { name: AgentName; description: string }[] = [
  { name: "Research", description: "Destination & weather" },
  { name: "Planner", description: "Itinerary & repairs" },
  { name: "Adapter", description: "Your disruption report" },
  { name: "Critic", description: "Constraints & review" },
  { name: "Policy", description: "Permissions & approvals" },
  { name: "Runtime", description: "Harness & execution" },
];
export function AgentProgress({
  trace,
  busy,
  error,
}: {
  trace: TraceEvent[];
  busy: boolean;
  error: string;
}) {
  if (!busy && !trace.length) return null;
  return (
    <section
      id="agent-progress"
      className="agent-progress card"
      aria-label="Agent progress"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">LIVE WORKFLOW</span>
          <h2>
            {busy
              ? "Your agents at work"
              : error
                ? "Execution stopped"
                : "Execution complete"}
          </h2>
        </div>
        <span className="muted">Actual runtime events</span>
      </div>
      <div className="agent-progress-grid" aria-live="polite">
        {agents.map(({ name, description }) => {
          const events = trace.filter((e) => e.agent === name);
          const last = events.at(-1);
          const status = !last
            ? busy
              ? "Waiting / not needed"
              : "Not used"
            : last.status === "running"
              ? busy
                ? "Working"
                : "Interrupted"
              : last.status === "success"
                ? busy
                  ? "Step complete"
                  : "Complete"
                : last.status === "approval"
                  ? "Awaiting approval"
                  : last.status === "blocked"
                    ? "Blocked"
                    : last.status === "failed"
                      ? "Failed"
                      : "Needs review";
          return (
            <article
              key={name}
              className={`agent-step ${last?.status || "idle"}`}
              data-agent={name}
            >
              <div>
                <strong>{name}</strong>
                <span>{status}</span>
              </div>
              <small>{description}</small>
              <p>{last?.detail || "No activity reported in this operation."}</p>
              {last?.model && <small>{last.model}</small>}
            </article>
          );
        })}
      </div>
      <details>
        <summary>Inspect this operation’s events ({trace.length})</summary>
        <TraceList trace={trace} />
      </details>
    </section>
  );
}
