import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getActivities } from '@/lib/data/activities';
import { getPlatformEventById } from '@/lib/data/events';
import { EventEditForm } from '@/components/admin/event-edit-form';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const event = await getPlatformEventById(id);
  return {
    title: event ? `${event.title} · CrewUp Admin` : 'Event not found · CrewUp Admin',
  };
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const [event, activities] = await Promise.all([getPlatformEventById(id), getActivities()]);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/events" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Back to events
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit {event.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">Update this platform event.</p>
      </div>
      <EventEditForm event={event} activities={activities} mode="edit" />
    </div>
  );
}
