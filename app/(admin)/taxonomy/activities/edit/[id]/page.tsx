import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getActivityById } from '@/lib/data/activities';
import { ActivityEditForm } from '@/components/admin/activity-edit-form';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  if (id === 'new') {
    return { title: 'Add activity · CrewUp Admin' };
  }

  const activity = await getActivityById(id);
  return {
    title: activity ? `${activity.name} · CrewUp Admin` : 'Activity not found · CrewUp Admin',
  };
}

export default async function ActivityEditPage({ params }: Props) {
  const { id } = await params;

  if (id === 'new') {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/taxonomy/activities" className="text-sm text-zinc-500 hover:text-zinc-800">
            ← Back to activities
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Add activity</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Creates a new activity row via the Nhost GraphQL API.
          </p>
        </div>
        <ActivityEditForm activity={null} mode="create" />
      </div>
    );
  }

  const activity = await getActivityById(id);
  if (!activity) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/taxonomy/activities" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Back to activities
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit {activity.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Update this activity via the Nhost GraphQL API.
        </p>
      </div>
      <ActivityEditForm activity={activity} mode="edit" />
    </div>
  );
}
