import { useState } from "react";
import {
  Compass,
  Map,
  Activity,
  ArrowUpRight,
  ArrowRight,
  RotateCcw,
  Zap,
  X,
  ShieldCheck,
  SlidersHorizontal,
  Check,
  LoaderCircle,
  Terminal,
  Sparkles,
  MapPin,
  Clock3,
  ChevronDown,
  CloudRain,
  Hotel,
  Utensils,
  Unplug,
  Wallet,
  Ban,
  TicketCheck,
  Bot,
} from "lucide-react";
import { TripPreferencesForm } from "./components/TripPreferencesForm";
import { TripMap } from "./runtime/TripMap";
import { AgentOps, TraceList } from "./runtime/AgentOps";
import { useRuntime } from "./runtime/useRuntime";
import { money, dateLabel } from "./lib/format";
import type { ChaosKind } from "../shared/runtime";
import "./App.css";

const disruptions: {
  kind: ChaosKind;
  title: string;
  detail: string;
  icon: typeof Hotel;
}[] = [
  {
    kind: "hotel_price",
    title: "Hotel price spike",
    detail: "Raise a stay price, detect the budget breach, repair.",
    icon: Hotel,
  },
  {
    kind: "restaurant_closed",
    title: "Restaurant closure",
    detail: "Replace one restaurant. Keep the rest of the day.",
    icon: Utensils,
  },
  {
    kind: "api_timeout",
    title: "Route timeout",
    detail: "Two retries, then recover cached estimates.",
    icon: Unplug,
  },
  {
    kind: "model_failure",
    title: "Model failure",
    detail: "Fail the primary call and route to a fallback.",
    icon: Bot,
  },
  {
    kind: "budget_cut",
    title: "Budget reduction",
    detail: "Reduce the budget 25% and reevaluate the plan.",
    icon: Wallet,
  },
  {
    kind: "unauthorized_tool",
    title: "Unauthorized cancellation",
    detail: "Watch the policy engine block the request.",
    icon: Ban,
  },
  {
    kind: "booking_request",
    title: "Booking approval",
    detail: "Pause a demo reservation for a human decision.",
    icon: TicketCheck,
  },
  {
    kind: "rain",
    title: "Rain forecast",
    detail: "Simulate rain and find an indoor alternative.",
    icon: CloudRain,
  },
];
export default function App() {
  const runtime = useRuntime();
  const run = runtime.session?.run || null;
  const [tab, setTab] = useState<"trip" | "ops">("trip"),
    [brief, setBrief] = useState(true),
    [chaos, setChaos] = useState(false),
    [day, setDay] = useState(0),
    [selected, setSelected] = useState("");
  const current =
    run?.itinerary.days[Math.min(day, (run?.itinerary.days.length || 1) - 1)];
  const activities = current?.activities || [];
  const remaining = run
    ? run.preferences.budget - run.itinerary.totalEstimatedCost
    : 0;
  async function inject(kind: ChaosKind) {
    setChaos(false);
    setTab("ops");
    await runtime.chaos(kind);
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to workspace
      </a>
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-symbol">
            <Compass size={24} />
          </span>
          Travel<span>OS</span>
        </a>
        <span className="workspace-label">AUTONOMOUS TRAVEL WORKSPACE</span>
        <nav aria-label="Workspace">
          <button
            className={tab === "trip" ? "active" : ""}
            onClick={() => setTab("trip")}
          >
            <Map size={18} />
            Trip workspace
            <ArrowUpRight size={14} />
          </button>
          <button
            className={tab === "ops" ? "active" : ""}
            onClick={() => setTab("ops")}
          >
            <Activity size={18} />
            AgentOps{runtime.busy && <i className="status-dot" />}
          </button>
        </nav>
        <div className="sidebar-trip">
          <span className="eyebrow">CURRENT JOURNEY</span>
          <h3>{run?.preferences.destination || "Your next adventure"}</h3>
          <p>
            {run
              ? `${run.itinerary.days.length} days · ${run.preferences.travelers} travelers`
              : "A little intention. A better journey."}
          </p>
          <button
            onClick={() => {
              setBrief(true);
              setTab("trip");
            }}
          >
            Edit trip brief <ArrowRight size={15} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="engine-label">
            <span
              className={`status-dot ${runtime.status?.ready ? "" : "offline"}`}
            />
            {runtime.status?.engine === "trueforge"
              ? "TrueForge configured"
              : "OpenAI runtime"}
          </div>
          <p>
            {runtime.status?.engine === "trueforge"
              ? "Harness sessions + TravelOS controls"
              : "Direct mode · TrueForge not active"}
          </p>
          <span className="version">TRAVELOS / RUNTIME EDITION</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            Workspace <span>/</span>
            <b>{tab === "trip" ? "Trip planner" : "Agent operations"}</b>
          </div>
          <div className="topbar-actions">
            <span className="safe-label">
              <ShieldCheck size={15} />
              Human in control
            </span>
            <button className="avatar" title="Local traveler profile">
              T
            </button>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                PLAN WITH INTENTION. ADAPT WITH CONFIDENCE.
              </span>
              <h1>
                {tab === "ops"
                  ? "Autonomy, with accountability."
                  : run
                    ? `Let’s explore ${run.preferences.destination.split(",")[0]}.`
                    : "A trip that keeps up with you."}
              </h1>
              <p>
                {tab === "ops"
                  ? "Watch models, tools, policies, and recovery work together."
                  : "An intelligent itinerary. A watchful runtime. You, enjoying the journey."}
              </p>
            </div>
            <div className="heading-actions">
              <button
                className="secondary-button"
                onClick={() => setBrief(!brief)}
              >
                <SlidersHorizontal size={16} />
                Trip brief
              </button>
              <button
                className="chaos-button"
                disabled={!run || runtime.busy}
                onClick={() => setChaos(true)}
              >
                <Zap size={16} />
                Chaos lab
              </button>
            </div>
          </div>
          {runtime.status && !runtime.status.ready && (
            <div className="setup-banner" role="alert">
              <Terminal size={20} />
              <div>
                <strong>Connect the planner before you begin</strong>
                <p>{runtime.status.message}</p>
              </div>
              <button
                className="secondary-button"
                onClick={() => void runtime.checkConnection(true)}
              >
                Check connection
              </button>
            </div>
          )}
          {runtime.status?.ready && (
            <div className="connection-line">
              <Check size={14} />
              <span>{runtime.status.message}</span>
              <button onClick={() => void runtime.checkConnection(true)}>
                Verify connection
              </button>
            </div>
          )}
          {runtime.error && (
            <div className="error-banner" role="alert">
              <strong>The run needs attention.</strong>
              <p>{runtime.error}</p>
              {run && <p>Your previous itinerary is still available.</p>}
              <button
                className="secondary-button"
                disabled={runtime.busy}
                onClick={() => void runtime.retry()}
              >
                Try Again
              </button>
            </div>
          )}
          {runtime.busy && (
            <div className="run-banner" role="status">
              <LoaderCircle className="spin" size={18} />
              <div>
                <strong>
                  {runtime.trace.at(-1)?.action || "Starting the runtime"}
                </strong>
                <span>
                  {runtime.trace.at(-1)?.detail ||
                    "Validating your trip preferences…"}
                </span>
              </div>
              <button onClick={() => setTab("ops")}>
                Watch execution <ArrowRight size={15} />
              </button>
            </div>
          )}
          {tab === "ops" ? (
            <AgentOps
              run={run}
              trace={runtime.trace}
              busy={runtime.busy}
              onApprove={(id, d) => void runtime.approve(id, d)}
            />
          ) : (
            <>
              {brief && (
                <section className="brief-card">
                  <div className="brief-intro">
                    <span className="eyebrow">01 / THE TRIP BRIEF</span>
                    <h2>
                      Make room for
                      <br />
                      <em>your kind of trip.</em>
                    </h2>
                    <p>
                      Tell your planner what matters. The runtime handles the
                      constraints.
                    </p>
                    <div className="runtime-settings">
                      <label>
                        Wake-up time
                        <input
                          type="time"
                          value={runtime.settings.wakeUpTime}
                          disabled={runtime.busy}
                          onChange={(e) =>
                            runtime.setSettings((s) => ({
                              ...s,
                              wakeUpTime: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Max walking per leg
                        <select
                          value={runtime.settings.maxWalkingMinutes}
                          disabled={runtime.busy}
                          onChange={(e) =>
                            runtime.setSettings((s) => ({
                              ...s,
                              maxWalkingMinutes: Number(e.target.value),
                            }))
                          }
                        >
                          {[10, 20, 30, 45, 60].map((n) => (
                            <option key={n} value={n}>
                              {n} minutes
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        AI execution budget
                        <select
                          disabled={runtime.busy}
                          value={runtime.settings.executionBudget}
                          onChange={(e) =>
                            runtime.setSettings((s) => ({
                              ...s,
                              executionBudget: Number(e.target.value),
                            }))
                          }
                        >
                          {[0.1, 0.25, 0.5, 1, 2].map((n) => (
                            <option value={n} key={n}>
                              ${n.toFixed(2)} per run
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="brief-note">
                      <ShieldCheck size={18} />
                      <span>
                        Nothing is booked or charged without you. Booking demos
                        never spend money.
                      </span>
                    </div>
                  </div>
                  <TripPreferencesForm
                    busy={runtime.busy}
                    disabled={!runtime.status?.ready}
                    onGenerate={async (p) => {
                      setDay(0);
                      await runtime.generate(p);
                    }}
                  />
                </section>
              )}
              {run ? (
                <section aria-label="Your itinerary">
                  <div className="journey-overview">
                    <div>
                      <span className="eyebrow">
                        YOUR JOURNEY / VERSION {run.version}
                      </span>
                      <h2>{run.itinerary.title}</h2>
                      <p>
                        {dateLabel(run.preferences.startDate)} —{" "}
                        {dateLabel(run.preferences.endDate)} ·{" "}
                        {run.preferences.travelers} travelers
                      </p>
                    </div>
                    <button
                      className="secondary-button"
                      disabled={runtime.busy}
                      onClick={() => void runtime.generate(run.preferences)}
                    >
                      <RotateCcw size={15} />
                      Regenerate
                    </button>
                  </div>
                  <div className="summary-grid">
                    <div>
                      <span>TRIP ESTIMATE</span>
                      <strong>{money(run.itinerary.totalEstimatedCost)}</strong>
                      <small className={remaining < 0 ? "danger" : ""}>
                        {money(Math.abs(remaining))}{" "}
                        {remaining < 0 ? "over budget" : "remaining"}
                      </small>
                    </div>
                    <div>
                      <span>CONSTRAINT SCORE</span>
                      <strong>
                        {run.evaluation.score}
                        <i>/100</i>
                      </strong>
                      <small>
                        {run.status === "ready"
                          ? "Known constraints pass"
                          : "Review failed constraints"}
                      </small>
                    </div>
                    <div>
                      <span>AI EXECUTION</span>
                      <strong>${run.executionCost.toFixed(3)}</strong>
                      <small>
                        of ${run.executionBudget.toFixed(2)} run budget ·
                        estimate
                      </small>
                    </div>
                    <div>
                      <span>RUNTIME</span>
                      <strong className="small-stat">
                        <span
                          className={`status-dot ${run.status === "ready" ? "" : "offline"}`}
                        />
                        {run.status === "ready"
                          ? "Ready to explore"
                          : "Needs attention"}
                      </strong>
                      <small>
                        {run.engine === "trueforge"
                          ? "TrueForge harness"
                          : "Direct OpenAI"}{" "}
                        · {run.trace.length} events
                      </small>
                    </div>
                  </div>
                  <div className="explanation">
                    <Sparkles size={18} />
                    <p>{run.explanation}</p>
                  </div>
                  <div className="itinerary-toolbar">
                    <div
                      className="day-tabs"
                      role="tablist"
                      aria-label="Trip days"
                    >
                      {run.itinerary.days.map((d, i) => (
                        <button
                          key={d.date}
                          role="tab"
                          aria-selected={day === i}
                          className={day === i ? "active" : ""}
                          onClick={() => {
                            setDay(i);
                            setSelected("");
                          }}
                        >
                          Day {i + 1}
                          <small>{dateLabel(d.date)}</small>
                        </button>
                      ))}
                    </div>
                    <span className="proposal-label">Proposed, not booked</span>
                  </div>
                  <div className="itinerary-grid">
                    <div className="map-column">
                      <TripMap
                        activities={activities}
                        selected={selected}
                        onSelect={(id) => {
                          setSelected(id);
                          document
                            .getElementById(`activity-${id}`)
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "nearest",
                            });
                        }}
                        research={run.research}
                      />
                      <div className="map-details">
                        <MapPin size={16} />
                        <span>
                          {run.research
                            ? `${run.research.name} · ${run.research.source}`
                            : "Venue coordinates proposed by the model."}
                        </span>
                        <p>
                          {run.research?.weather ||
                            "Live forecast unavailable. No weather guarantees."}
                        </p>
                      </div>
                      <details className="card assumptions">
                        <summary>
                          Assumptions & things to confirm{" "}
                          <ChevronDown size={15} />
                        </summary>
                        {[
                          ...run.itinerary.assumptions,
                          ...run.itinerary.warnings,
                          "Opening hours, venue availability, walking routes and dietary suitability require confirmation.",
                        ].map((a, i) => (
                          <p key={i}>{a}</p>
                        ))}
                      </details>
                    </div>
                    <section className="timeline" aria-label={`Day ${day + 1}`}>
                      <div className="timeline-heading">
                        <span className="eyebrow">
                          DAY {day + 1} · {current && dateLabel(current.date)}
                        </span>
                        <h3>{current?.summary}</h3>
                        <span>
                          {current && money(current.estimatedDailyCost)}{" "}
                          estimated · whole party
                        </span>
                      </div>
                      <ol>
                        {activities.map((a, i) => (
                          <li
                            key={a.id}
                            id={`activity-${a.id}`}
                            className={selected === a.id ? "selected" : ""}
                          >
                            <button
                              className="activity-select"
                              onClick={() => setSelected(a.id)}
                            >
                              <span className="activity-number">{i + 1}</span>
                              <span className="activity-content">
                                <span className="activity-time">
                                  {a.startTime} — {a.endTime}
                                  <i>{a.category.replace("-", " ")}</i>
                                </span>
                                <strong>{a.title}</strong>
                                <span>{a.description}</span>
                                <span className="activity-place">
                                  <MapPin size={12} />
                                  {a.location.name}
                                </span>
                                <span className="activity-bottom">
                                  <span>
                                    <Clock3 size={12} />
                                    {a.durationMinutes} min
                                  </span>
                                  <b>
                                    {a.estimatedCost === 0
                                      ? "Free"
                                      : money(a.estimatedCost)}
                                  </b>
                                </span>
                                {a.notes && <small>{a.notes}</small>}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ol>
                    </section>
                  </div>
                  <section className="revisions">
                    <div className="section-heading">
                      <h3>A trip that improves.</h3>
                      <button onClick={() => setTab("ops")}>
                        See full execution trace <ArrowUpRight size={15} />
                      </button>
                    </div>
                    <div>
                      {run.revisions.map((r, i) => (
                        <article key={i}>
                          <span>VERSION {r.version}</span>
                          <strong>{r.reason.replaceAll("_", " ")}</strong>
                          <p>
                            {money(r.cost)} · score {r.score}/100
                          </p>
                          <small>
                            {r.changedActivityIds.length
                              ? `${r.changedActivityIds.length} activities changed`
                              : "Plan evaluated"}
                          </small>
                        </article>
                      ))}
                    </div>
                  </section>
                </section>
              ) : (
                <section className="empty-workspace">
                  <div className="empty-compass">
                    <Compass size={42} />
                  </div>
                  <span className="eyebrow">
                    NOT JUST A PLAN. A PLAN THAT ADAPTS.
                  </span>
                  <h2>
                    The world changes.
                    <br />
                    Your itinerary can, too.
                  </h2>
                  <p>
                    Generate your trip, introduce a disruption, and watch the
                    runtime recover. Every action stays visible and under your
                    control.
                  </p>
                  <div className="demo-sequence">
                    {["Generate", "Break", "Observe", "Recover", "Approve"].map(
                      (s, i) => (
                        <span key={s}>
                          <b>0{i + 1}</b>
                          {s}
                          {i < 4 && <ArrowRight size={14} />}
                        </span>
                      ),
                    )}
                  </div>
                  {runtime.busy && <TraceList trace={runtime.trace} />}
                </section>
              )}
            </>
          )}
          <footer>
            <span>
              TRAVELOS — THE PRODUCTION RUNTIME FOR AUTONOMOUS TRAVEL AGENTS
            </span>
            <span>Hackathon build · estimates & simulations labelled</span>
          </footer>
        </main>
      </div>
      {chaos && (
        <div className="modal-backdrop" onClick={() => setChaos(false)}>
          <section
            className="chaos-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Chaos lab"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setChaos(false)}
              aria-label="Close chaos lab"
            >
              <X />
            </button>
            <span className="eyebrow">
              CONTROLLED DISRUPTIONS / REAL RECOVERY LOGIC
            </span>
            <h2>Let’s break the plan.</h2>
            <p>
              These are explicitly simulated events. Watch the runtime detect,
              recover, or safely stop.
            </p>
            <div className="chaos-grid">
              {disruptions.map((d) => (
                <button
                  key={d.kind}
                  disabled={runtime.busy}
                  onClick={() => void inject(d.kind)}
                >
                  <d.icon size={22} />
                  <strong>{d.title}</strong>
                  <span>{d.detail}</span>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
