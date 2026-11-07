import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getActivities, getActivityById } from '@/lib/data/activities';
import { ActivityEditForm } from '@/components/admin/activity-edit-form';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ group?: string; parent?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { id } = await params;
  if (id === 'new') {
    const { group } = await searchParams;
    return { title: `${group ? 'Add group' : 'Add activity'} · CrewUp Admin` };
  }

  const activity = await getActivityById(id);
  return {
    title: activity ? `${activity.name} · CrewUp Admin` : 'Activity not found · CrewUp Admin',
  };
}

export default async function ActivityEditPage({ params, searchParams }: Props) {
  const { id } = await params;
  const all = await getActivities();
  const groups = all.filter((activity) => activity.parent_id === null);

  if (id === 'new') {
    const { group, parent } = await searchParams;
    const isGroup = Boolean(group);
    const initialParentId = groups.some((g) => g.id === parent) ? parent! : null;

    return (
      <div className="space-y-6">
        <div>
          <Link href="/taxonomy/activities" className="text-sm text-zinc-500 hover:text-zinc-800">
            ← Back to activities
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{isGroup ? 'Add group' : 'Add activity'}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isGroup
              ? 'Groups hold activities. Events cannot pick a group directly.'
              : 'Activities belong to one group and can be picked on events.'}
          </p>
        </div>
        <ActivityEditForm
          activity={null}
          mode="create"
          groups={groups}
          isGroup={isGroup}
          initialParentId={initialParentId}
          childCount={0}
        />
      </div>
    );
  }

  const activity = all.find((row) => row.id === id) ?? (await getActivityById(id));
  if (!activity) {
    notFound();
  }

  const isGroup = activity.parent_id === null;
  const childCount = all.filter((row) => row.parent_id === activity.id).length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/taxonomy/activities" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Back to activities
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit {activity.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {isGroup
            ? `Group with ${childCount} ${childCount === 1 ? 'activity' : 'activities'}.`
            : 'Update this activity via the Nhost GraphQL API.'}
        </p>
      </div>
      <ActivityEditForm
        activity={activity}
        mode="edit"
        groups={groups.filter((g) => g.id !== activity.id)}
        isGroup={isGroup}
        initialParentId={activity.parent_id}
        childCount={childCount}
      />
    </div>
  );
}
