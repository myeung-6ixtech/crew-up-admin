import Link from 'next/link';
import { getActivities } from '@/lib/data/activities';
import { EventEditForm } from '@/components/admin/event-edit-form';

export const metadata = { title: 'Create event · CrewUp Admin' };

export default async function CreateEventPage() {
  const activities = await getActivities();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/events" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Back to events
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Create event</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Creates a platform-hosted event via the admin Nhost function.
        </p>
      </div>
      <EventEditForm event={null} activities={activities} mode="create" />
    </div>
  );
}
