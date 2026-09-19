import type { Itinerary } from '../../shared/itinerary';
import type { TripPreferences } from '../../shared/preferences';
import { dateLabel, money, optionLabel } from '../lib/format';
import { ActivityCard } from './ActivityCard';

export function ItineraryView({ itinerary, preferences, busy, onRegenerate }: {
  itinerary: Itinerary; preferences: TripPreferences; busy: boolean; onRegenerate: () => void;
}) {
  const remaining = preferences.budget - itinerary.totalEstimatedCost;
  return <section className="itinerary" aria-label="Your itinerary">
    <div className="itinerary-heading"><div><span className="eyebrow">02 / YOUR ITINERARY</span><h2>{itinerary.destination}</h2></div>
      <button className="secondary-button" disabled={busy} onClick={onRegenerate}>Regenerate <span aria-hidden="true">↻</span></button>
    </div>
    <p className="trip-title">{itinerary.title}</p>
    <p className="trip-dates">{dateLabel(itinerary.startDate)} – {dateLabel(itinerary.endDate)} · {itinerary.travelers} travelers · {itinerary.days.length} days</p>
    <div className="budget-card"><div><span className="eyebrow">ESTIMATED TRIP COST</span><strong>{money(itinerary.totalEstimatedCost)}</strong><span>of {money(preferences.budget)} budget · whole party</span></div>
      <span className={remaining < 0 ? 'budget-over' : 'budget-remaining'}>{money(Math.abs(remaining))} {remaining < 0 ? 'over budget' : 'remaining'}</span>
    </div>
    <p className="proposal-note">AI-proposed, not live-verified. Prices, opening hours, dietary suitability, and availability need confirmation. Flights excluded. Nothing is booked.</p>
    {remaining < 0 && <p className="notice">This proposal exceeds your budget. Review the estimates or regenerate before making plans.</p>}
    <div className="preference-summary"><span>{optionLabel(preferences.pace)} pace</span><span>{optionLabel(preferences.transportation)}</span><span>{optionLabel(preferences.hotelPreference)} stays</span></div>
    {itinerary.warnings.length > 0 && <aside className="notice"><h3>Before you go</h3><ul>{itinerary.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></aside>}
    {itinerary.assumptions.length > 0 && <details className="assumptions"><summary>Planning assumptions</summary><ul>{itinerary.assumptions.map((assumption, i) => <li key={i}>{assumption}</li>)}</ul></details>}
    <nav className="day-navigation" aria-label="Itinerary days">{itinerary.days.map((day, i) => <a key={day.date} href={`#day-${day.date}`}>Day {i + 1}</a>)}</nav>
    {itinerary.days.map((day, i) => <section className="day-section" id={`day-${day.date}`} key={day.date} aria-label={`Day ${i + 1}`}>
      <div className="day-heading"><span className="day-number">{String(i + 1).padStart(2, '0')}</span><div><span className="eyebrow">DAY {i + 1} · {dateLabel(day.date)}</span><h3>{day.summary}</h3></div><span className="daily-cost">{money(day.estimatedDailyCost)}</span></div>
      <ol className="activities">{day.activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}</ol>
    </section>)}
    <p className="itinerary-footer">Your time, thoughtfully planned. All times are local to your destination.</p>
  </section>;
}
