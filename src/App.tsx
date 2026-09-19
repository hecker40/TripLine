import { TripPreferencesForm } from './components/TripPreferencesForm';
import { ItineraryView } from './components/ItineraryView';
import { PlanningState } from './components/PlanningState';
import { useTripPlanner } from './hooks/useTripPlanner';
import './App.css';

export default function App() {
  const planner = useTripPlanner();
  return <div className="travelos-root">
    <a className="skip-link" href="#preferences">Skip to trip preferences</a>
    <header className="site-header"><a className="wordmark" href="/" aria-label="TravelOS home"><span className="brand-icon" aria-hidden="true">↗</span>Travel<span>OS</span></a><span className="header-note">LESS PLANNING. MORE POSSIBILITY.</span><span className="header-badge">Your personal trip planner</span></header>
    <main>
      <div className="intro"><div><span className="eyebrow">A LITTLE INTENTION. A BETTER JOURNEY.</span><h1>A good trip starts <em>with you.</em></h1></div><p>Your interests, your pace, your budget.<br />An itinerary with room to be yourself.</p></div>
      <div className="planner-layout"><div id="preferences"><TripPreferencesForm busy={planner.isGenerating} onGenerate={planner.generate} /></div>
        <div className="results-column" aria-busy={planner.isGenerating}>
          <div aria-live="polite" role="status" className={planner.isGenerating ? 'loading-banner' : 'sr-only'}>{planner.isGenerating ? 'Planning your trip… Waiting for a validated itinerary.' : planner.itinerary ? 'Your itinerary is ready.' : ''}</div>
          {planner.generationError && <div className="error-banner" role="alert"><h2>We couldn’t generate your itinerary.</h2><p>{planner.generationError}</p>{planner.itinerary && <p>Your previous itinerary is still here.</p>}<button className="secondary-button" disabled={planner.isGenerating} onClick={() => planner.lastAttempt && void planner.generate(planner.lastAttempt)}>Try Again</button></div>}
          {planner.itinerary && planner.plannedPreferences ? <ItineraryView itinerary={planner.itinerary} preferences={planner.plannedPreferences} busy={planner.isGenerating}
            onRegenerate={() => planner.plannedPreferences && void planner.generate(planner.plannedPreferences)} /> : <PlanningState busy={planner.isGenerating} />}
        </div>
      </div>
    </main>
    <footer className="site-footer"><span>TravelOS / Thoughtful journeys, from the first step.</span><span>Proposals, not reservations.</span></footer>
  </div>;
}
