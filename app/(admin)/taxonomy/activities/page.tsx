import { getActivities, getActivityUsageCounts } from '@/lib/data/activities';
import { ActivitiesList } from '@/components/admin/activities-list';
import { parsePage } from '@/components/admin/list-pagination';

export default async function ActivitiesTaxonomyPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const [activities, usageCounts] = await Promise.all([getActivities(), getActivityUsageCounts()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Activities</h1>
        <p className="mt-1 text-sm text-zinc-500">
          One list. A group row is followed by the activities inside it. Events and profiles use the
          activities, not the groups. Deactivate instead of deleting activities linked to events or
          profiles.
        </p>
      </div>
      <ActivitiesList activities={activities} usageCounts={usageCounts} page={parsePage(page)} />
    </div>
  );
}
