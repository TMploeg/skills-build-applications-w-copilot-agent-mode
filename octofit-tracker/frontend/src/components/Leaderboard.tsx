import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return <CapabilityCard
    title="Leaderboard"
    description="Compare team point totals."
    emptyMessage="No leaderboard rankings yet."
    loadItems={async () => (await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')).leaderboard}
    renderItem={(entry) => <><strong>#{entry.rank} {entry.teamName}</strong> - {entry.totalPoints} points</>}
  />;
}
