import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  return <CapabilityCard
    title="Activities"
    description="Track student activity minutes and points."
    emptyMessage="No activities yet."
    loadItems={async () => (await getJson<{ activities: Activity[] }>('/api/activities')).activities}
    renderItem={(activity) => <><strong>{activity.type}</strong> - {activity.minutes} minutes, {activity.points} points</>}
  />;
}
