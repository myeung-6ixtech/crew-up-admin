import { getActivities, getActivityUsageCounts } from '@/lib/data/activities';
import { ActivitiesList } from '@/components/admin/activities-list';

export default async function ActivitiesTaxonomyPage() {
  const [activities, usageCounts] = await Promise.all([getActivities(), getActivityUsageCounts()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Activities</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage activity types for layover events and user preferences. Deactivate instead of
          deleting activities linked to events or profiles.
        </p>
      </div>
      <ActivitiesList activities={activities} usageCounts={usageCounts} />
    </div>
  );
}
