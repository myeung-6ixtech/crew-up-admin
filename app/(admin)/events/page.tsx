import { getPlatformEvents } from '@/lib/data/events';
import { EventsList } from '@/components/admin/events-list';

export default async function EventsPage() {
  const events = await getPlatformEvents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Events</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage CrewUp-hosted promotional meetups. Published platform events are visible to all
          verified users in the mobile app.
        </p>
      </div>
      <EventsList events={events} />
    </div>
  );
}
