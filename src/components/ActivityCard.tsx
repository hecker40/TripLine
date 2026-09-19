import type { Activity } from '../../shared/itinerary';
import { money, optionLabel } from '../lib/format';

export function ActivityCard({ activity }: { activity: Activity }) {
  return <li className={`activity-card category-${activity.category}`}>
    <div className="activity-time"><time>{activity.startTime}</time><span>{activity.endTime}</span></div>
    <div className="activity-body">
      <div className="activity-heading"><h4>{activity.title}</h4><span className="category-badge">{optionLabel(activity.category)}</span></div>
      <p>{activity.description}</p>
      <div className="activity-meta"><span>{activity.location.name}</span><span>{activity.durationMinutes} min</span><strong>{money(activity.estimatedCost)}</strong></div>
      {activity.location.address && <p className="activity-note">{activity.location.address}</p>}
      {activity.notes && <p className="activity-note">{activity.notes}</p>}
    </div>
  </li>;
}
