import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: string[] };

export default function Teams() {
  return <CapabilityCard
    title="Teams"
    description="Manage teams and members."
    emptyMessage="No teams yet."
    loadItems={async () => (await getJson<{ teams: Team[] }>('/api/teams')).teams}
    renderItem={(team) => <><strong>{team.name}</strong> - {team.members.length} members</>}
  />;
}
