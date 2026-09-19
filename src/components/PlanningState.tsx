export function PlanningState({ busy }: { busy: boolean }) {
  return <section className={`empty-state ${busy ? 'planning-state' : ''}`} aria-label={busy ? 'Planning in progress' : 'Get started'}>
    <div className="compass" aria-hidden="true"><span>N</span><svg viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="48" /><circle cx="60" cy="60" r="35" /><path d="M60 8v15M60 97v15M8 60h15M97 60h15M42 80l10-28 28-12-12 28z" /><path className="compass-needle" d="m52 52 28-12-12 28z" /></svg></div>
    <span className="eyebrow">{busy ? 'YOUR PLANNER IS WORKING' : 'ROOM FOR DISCOVERY'}</span>
    <h2>{busy ? 'Planning your trip…' : 'Your next chapter\nstarts here.'}</h2>
    <p>{busy ? 'The Planner is creating your itinerary. It will appear here after validation. This may take up to 90 seconds.' : 'Tell TravelOS where you want to go and what kind of trip you want. We’ll turn the details into a day-by-day proposal.'}</p>
    {!busy && <div className="empty-details"><span>01 · Your preferences</span><span>02 · A thoughtful plan</span><span>03 · Make it yours</span></div>}
  </section>;
}
