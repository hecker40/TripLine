import {
  CheckCircle2,
  CircleAlert,
  Shield,
  Activity,
  Clock3,
  Coins,
} from "lucide-react";
import type { TraceEvent, TripRun } from "../../shared/runtime";
export function TraceList({ trace }: { trace: TraceEvent[] }) {
  return (
    <ol className="trace-list">
      {trace.length === 0 && (
        <li className="empty-trace">
          Execution events appear here as the runtime works. No fabricated
          steps.
        </li>
      )}
      {[...trace].reverse().map((e) => (
        <li key={e.id} className={`trace-row ${e.status}`}>
          <span className="trace-dot" />
          <div>
            <div className="trace-title">
              <strong>{e.agent}</strong>
              <code>{e.action}</code>
              <span className="trace-time">
                {new Date(e.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p>{e.detail}</p>
            <div className="trace-meta">
              {e.model && <span>{e.model}</span>}
              {e.durationMs !== undefined && <span>{e.durationMs} ms</span>}
              {e.inputTokens !== undefined && (
                <span>{e.inputTokens + (e.outputTokens || 0)} tokens</span>
              )}
              {e.cost !== undefined && (
                <span>${e.cost.toFixed(5)} estimated</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
export function AgentOps({
  run,
  trace,
  busy,
  onApprove,
}: {
  run: TripRun | null;
  trace: TraceEvent[];
  busy: boolean;
  onApprove: (id: string, d: "approve" | "deny") => void;
}) {
  const calls = trace.filter((t) => t.action === "model.complete").length,
    retries = trace.filter(
      (t) => t.action === "retry.backoff" || t.action === "output.retry",
    ).length;
  return (
    <div className="ops-layout">
      <div className="ops-main">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE RUNTIME, MADE VISIBLE</span>
            <h2>Every decision has a trail.</h2>
          </div>
          <span className={`live-label ${busy ? "pulsing" : ""}`}>
            <Activity size={14} />
            {busy ? "Executing" : "Execution history"}
          </span>
        </div>
        <div className="ops-metrics">
          <div>
            <Activity />
            <b>{calls}</b>
            <span>Model calls</span>
          </div>
          <div>
            <Clock3 />
            <b>{retries}</b>
            <span>Retries</span>
          </div>
          <div>
            <Shield />
            <b>{trace.filter((t) => t.status === "blocked").length}</b>
            <span>Blocked actions</span>
          </div>
          <div>
            <Coins />
            <b>${(run?.executionCost || 0).toFixed(3)}</b>
            <span>AI estimate</span>
          </div>
        </div>
        <TraceList trace={trace} />
      </div>
      <aside className="ops-side">
        <section className="card">
          <span className="eyebrow">EVALUATION</span>
          <h3>{run ? `${run.evaluation.score}/100` : "Awaiting a plan"}</h3>
          <p className="muted">
            Structural score, not a verified travel guarantee.
          </p>
          {run?.evaluation.checks.map((c) => (
            <div className={`check-row ${c.status}`} key={c.name}>
              {c.status === "pass" ? (
                <CheckCircle2 size={17} />
              ) : (
                <CircleAlert size={17} />
              )}
              <div>
                <strong>{c.name}</strong>
                <small>{c.detail}</small>
              </div>
              <span>{c.status}</span>
            </div>
          ))}
          {run && <p className="critic-note">{run.evaluation.feedback}</p>}
        </section>
        <section className="card">
          <span className="eyebrow">HUMAN CHECKPOINTS</span>
          <h3>You have the final say.</h3>
          <p className="muted">
            Demo approvals only. No purchases or reservations are executed.
          </p>
          {run?.approvals.map((a) => (
            <div className="approval" key={a.id}>
              <strong>{a.title}</strong>
              <p>
                ${a.amount.toFixed(2)} estimated · {a.status}
              </p>
              {a.status === "pending" && (
                <div className="approval-buttons">
                  <button
                    disabled={busy}
                    onClick={() => onApprove(a.id, "approve")}
                  >
                    Approve demo
                  </button>
                  <button
                    className="quiet"
                    disabled={busy}
                    onClick={() => onApprove(a.id, "deny")}
                  >
                    Deny
                  </button>
                </div>
              )}
            </div>
          ))}
          {!run?.approvals.length && (
            <p className="empty-trace">No requests awaiting approval.</p>
          )}
        </section>
        <section className="card">
          <span className="eyebrow">CAPABILITIES</span>
          <p>Planner: itinerary updates and route estimates.</p>
          <p>Research: geographic search, forecasts, route estimates.</p>
          <p>Cancellation & payments: denied.</p>
        </section>
      </aside>
    </div>
  );
}
