import Link from 'next/link';
import type { Activity } from '@/lib/types/activity';
import { ACTIVITY_CATEGORY_LABELS } from '@/lib/schemas/activity.schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';

export function ActivitiesList({
  activities,
  usageCounts,
}: {
  activities: Activity[];
  usageCounts: Record<string, { event_count: number; preference_count: number }>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href="/taxonomy/activities/edit/new">
          <Button>Add activity</Button>
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <Table>
          <THead>
            <TR>
              <TH>Slug</TH>
              <TH>Name</TH>
              <TH>Category</TH>
              <TH>Icon</TH>
              <TH>Order</TH>
              <TH>Usage</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {activities.length ? (
              activities.map((activity) => {
                const usage = usageCounts[activity.id] ?? { event_count: 0, preference_count: 0 };

                return (
                  <TR key={activity.id}>
                    <TD className="font-mono text-sm">{activity.slug}</TD>
                    <TD className="font-medium">{activity.name}</TD>
                    <TD>
                      {ACTIVITY_CATEGORY_LABELS[
                        activity.category as keyof typeof ACTIVITY_CATEGORY_LABELS
                      ] ?? activity.category}
                    </TD>
                    <TD>{activity.icon ?? '—'}</TD>
                    <TD>{activity.sort_order}</TD>
                    <TD className="text-sm text-zinc-600">
                      {usage.event_count} events · {usage.preference_count} prefs
                    </TD>
                    <TD>
                      {activity.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="warning">Inactive</Badge>
                      )}
                    </TD>
                    <TD className="text-right">
                      <Link href={`/taxonomy/activities/edit/${activity.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </TD>
                  </TR>
                );
              })
            ) : (
              <TR>
                <TD colSpan={8} className="text-zinc-500">
                  No activities yet. Add the first activity type for events and user preferences.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
