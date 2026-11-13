import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; reason: string };

export default function Workouts() {
  return <CapabilityCard
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    emptyMessage="No workout suggestions available."
    loadItems={async () => (await getJson<{ suggestions: WorkoutSuggestion[] }>(
      `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`,
    )).suggestions}
    renderItem={(suggestion) => <><strong>{suggestion.title}</strong> - {suggestion.reason}</>}
  />;
}
