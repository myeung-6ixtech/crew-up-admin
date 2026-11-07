'use client';

import { useMemo, useState } from 'react';
import type { Activity } from '@/lib/types/activity';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function ActivityPicker({
  activities,
  selectedIds,
  onChange,
}: {
  activities: Activity[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const groups = useMemo(() => {
    const parents = activities.filter((activity) => activity.parent_id === null);
    return parents
      .map((group) => ({
        group,
        children: activities.filter((activity) => activity.parent_id === group.id),
      }))
      .filter(({ children }) => children.length > 0);
  }, [activities]);

  const query = search.trim().toLowerCase();
  const visibleGroups = groups
    .map(({ group, children }) => ({
      group,
      children: children.filter((activity) => {
        if (!query) return true;
        return `${activity.name} ${activity.slug} ${group.name}`.toLowerCase().includes(query);
      }),
    }))
    .filter(({ children }) => children.length > 0);

  const selected = selectedIds
    .map((id) => activities.find((activity) => activity.id === id))
    .filter((activity): activity is Activity => Boolean(activity));

  function toggle(activityId: string) {
    onChange(
      selectedIds.includes(activityId)
        ? selectedIds.filter((id) => id !== activityId)
        : [...selectedIds, activityId],
    );
  }

  function openPicker() {
    setSearch('');
    setOpen(true);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Activities</Label>
        <Button type="button" variant="outline" onClick={openPicker}>
          {selectedIds.length ? `Choose activities (${selectedIds.length})` : 'Choose activities'}
        </Button>
      </div>
      {selected.length ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((activity) => (
            <button
              key={activity.id}
              type="button"
              onClick={() => toggle(activity.id)}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-800 hover:bg-zinc-100"
            >
              {activity.icon ? `${activity.icon} ` : ''}
              {activity.name}
              <span className="ml-2 text-zinc-400">Remove</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No activities selected.</p>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Choose activities"
        description="Search by name or group. The list stays in this dialog as more activities are added."
        className="max-w-xl"
      >
        <div className="space-y-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault();
            }}
            placeholder="Search activities"
            aria-label="Search activities"
            autoFocus
          />
          <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {visibleGroups.length ? (
              visibleGroups.map(({ group, children }) => (
                <div key={group.id} className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{group.name}</p>
                  <div className="grid gap-2">
                    {children.map((activity) => {
                      const isSelected = selectedIds.includes(activity.id);
                      return (
                        <button
                          key={activity.id}
                          type="button"
                          onClick={() => toggle(activity.id)}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                            isSelected
                              ? 'border-zinc-900 bg-zinc-900 text-white'
                              : 'border-zinc-200 bg-white hover:bg-zinc-50',
                          )}
                        >
                          {activity.icon ? `${activity.icon} ` : ''}
                          {activity.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-zinc-500">No activities match that search.</p>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
