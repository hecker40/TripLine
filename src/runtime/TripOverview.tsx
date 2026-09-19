import type { TripRun } from "../../shared/runtime";
import { dateLabel, money } from "../lib/format";

export function TripOverview({
  run,
  selectedDay,
  onSelect,
}: {
  run: TripRun;
  selectedDay: number;
  onSelect: (day: number) => void;
}) {
  return (
    <section className="card trip-overview" aria-label="All trip days">
      <span className="eyebrow">
        THE WHOLE PLAN / {run.itinerary.days.length} DAYS ·{" "}
        {Math.max(0, run.itinerary.days.length - 1)} NIGHTS
      </span>
      <h3>{run.planning ? "Why this trip works" : "Your trip, day by day"}</h3>
      {run.planning && (
        <>
          <p>{run.planning.rationale}</p>
          <p className="muted">
            Suggested lodging area: {run.planning.stayArea} · availability not
            yet checked
          </p>
        </>
      )}
      <div className="all-days-grid">
        {run.itinerary.days.map((day, index) => (
          <button
            key={day.date}
            aria-pressed={selectedDay === index}
            onClick={() => onSelect(index)}
          >
            <span>
              DAY {index + 1} · {dateLabel(day.date)}
            </span>
            <strong>{run.planning?.days.find((d) => d.date === day.date)?.theme || `Day ${index + 1} highlights`}</strong>
            <p className="day-preview-summary">{day.summary}</p>
            <small>
              {day.activities.length} scheduled blocks ·{" "}
              {money(day.estimatedDailyCost)} whole-party estimate
            </small>
            <ol>
              {day.activities
                .filter(
                  (a) =>
                    a.category === "activity" || a.category === "free-time",
                )
                .slice(0, 3)
                .map((a) => (
                  <li key={a.id}>
                    {a.startTime} · {a.title}
                  </li>
                ))}
            </ol>
            <span>View this day’s map & timeline →</span>
          </button>
        ))}
      </div>
    </section>
  );
}
