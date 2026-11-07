import Link from 'next/link';
import type { Activity } from '@/lib/types/activity';
import { ACTIVITY_KIND_LABELS } from '@/lib/schemas/activity.schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { ListPagination, paginate } from '@/components/admin/list-pagination';

type Usage = { event_count: number; preference_count: number };

type Row = {
  activity: Activity;
  depth: 0 | 1;
  groupName: string | null;
};

function hierarchyRows(activities: Activity[]): Row[] {
  const groups = activities.filter((activity) => activity.parent_id === null);
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const childrenByGroup = new Map<string, Activity[]>();
  const orphans: Activity[] = [];

  for (const activity of activities) {
    if (activity.parent_id === null) continue;
    const group = groupById.get(activity.parent_id);
    if (!group) {
      orphans.push(activity);
      continue;
    }
    const list = childrenByGroup.get(group.id) ?? [];
    list.push(activity);
    childrenByGroup.set(group.id, list);
  }

  const rows: Row[] = [];
  for (const group of groups) {
    rows.push({ activity: group, depth: 0, groupName: null });
    for (const child of childrenByGroup.get(group.id) ?? []) {
      rows.push({ activity: child, depth: 1, groupName: group.name });
    }
  }
  for (const orphan of orphans) {
    rows.push({ activity: orphan, depth: 1, groupName: orphan.category });
  }
  return rows;
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? <Badge variant="success">Active</Badge> : <Badge variant="warning">Inactive</Badge>;
}

export function ActivitiesList({
  activities,
  usageCounts,
  page,
}: {
  activities: Activity[];
  usageCounts: Record<string, Usage>;
  page: number;
}) {
  const rows = hierarchyRows(activities);
  const paged = paginate(rows, page);

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Link href="/taxonomy/activities/edit/new?group=1">
          <Button variant="outline">Add group</Button>
        </Link>
        <Link href="/taxonomy/activities/edit/new">
          <Button>Add activity</Button>
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Slug</TH>
              <TH>Kind</TH>
              <TH>Group</TH>
              <TH>Order</TH>
              <TH>Usage</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {paged.items.length ? (
              paged.items.map((row) => {
                const { activity, depth, groupName } = row;
                const usage = usageCounts[activity.id] ?? { event_count: 0, preference_count: 0 };
                const isGroup = depth === 0;
                return (
                  <TR key={activity.id} className={isGroup ? 'bg-zinc-50' : undefined}>
                    <TD>
                      <div className={isGroup ? 'font-medium' : 'pl-6 text-zinc-700'}>
                        {isGroup ? null : <span className="mr-2 text-zinc-400">└</span>}
                        {activity.icon ? `${activity.icon} ` : ''}
                        {activity.name}
                      </div>
                    </TD>
                    <TD className="font-mono text-sm">{activity.slug}</TD>
                    <TD>{isGroup ? 'Group' : (ACTIVITY_KIND_LABELS[activity.kind] ?? activity.kind)}</TD>
                    <TD>{groupName ?? '—'}</TD>
                    <TD>{activity.sort_order}</TD>
                    <TD className="text-sm text-zinc-600">
                      {isGroup ? '—' : `${usage.event_count} events · ${usage.preference_count} prefs`}
                    </TD>
                    <TD>
                      <StatusBadge active={activity.is_active} />
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        {isGroup ? (
                          <Link href={`/taxonomy/activities/edit/new?parent=${activity.id}`}>
                            <Button variant="outline" size="sm">
                              Add
                            </Button>
                          </Link>
                        ) : null}
                        <Link href={`/taxonomy/activities/edit/${activity.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </TD>
                  </TR>
                );
              })
            ) : (
              <TR>
                <TD colSpan={8} className="text-zinc-500">
                  No groups yet. Add a group, then add activities to it.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>

      <ListPagination
        page={paged.page}
        pages={paged.pages}
        from={paged.from}
        to={paged.to}
        total={paged.total}
        path="/taxonomy/activities"
      />
    </div>
  );
}
