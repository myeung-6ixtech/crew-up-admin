import { StatCard } from '@/components/admin/stat-card';
import { getEventAnalytics } from '@/lib/data/events';

export const metadata = { title: 'Event analytics · CrewUp Admin' };

export default async function EventAnalyticsPage() {
  const metrics = await getEventAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Event analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Counts for every event, including meets hosted by users. Upcoming means a start time that
          has not passed and the event is not cancelled.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Events" value={metrics.totalEvents} />
        <StatCard title="RSVPs" value={metrics.totalRsvps} />
        <StatCard title="Published" value={metrics.publishedEvents} />
        <StatCard title="Upcoming" value={metrics.upcomingEvents} />
        <StatCard title="Platform hosted" value={metrics.platformEvents} hint="Created in this dashboard" />
        <StatCard title="User hosted" value={metrics.userHostedEvents} />
      </section>
    </div>
  );
}
