'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Activity } from '@/lib/types/activity';
import { createActivityViaApi, updateActivityViaApi } from '@/lib/api/activities';
import {
  ACTIVITY_KINDS,
  ACTIVITY_KIND_LABELS,
  activitySchema,
  type ActivityKind,
} from '@/lib/schemas/activity.schema';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function ActivityEditForm({
  activity,
  mode,
  groups,
  isGroup,
  initialParentId,
  childCount,
}: {
  activity: Activity | null;
  mode: 'create' | 'edit';
  groups: Activity[];
  isGroup: boolean;
  initialParentId: string | null;
  childCount: number;
}) {
  const router = useRouter();
  const noun = isGroup ? 'group' : 'activity';
  const [slug, setSlug] = useState(activity?.slug ?? '');
  const [name, setName] = useState(activity?.name ?? '');
  const [description, setDescription] = useState(activity?.description ?? '');
  const [parentId, setParentId] = useState(initialParentId ?? '');
  const [kind, setKind] = useState<ActivityKind>(activity?.kind ?? 'activity');
  const [icon, setIcon] = useState(activity?.icon ?? '');
  const [sortOrder, setSortOrder] = useState(String(activity?.sort_order ?? 0));
  const [isActive, setIsActive] = useState(activity?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      if (!isGroup && !parentId) {
        throw new Error('Choose a group for this activity');
      }
      const parsed = activitySchema.parse({
        slug,
        name,
        description: description || undefined,
        parent_id: isGroup ? null : parentId,
        kind: isGroup ? 'activity' : kind,
        icon: icon || undefined,
        sort_order: Number(sortOrder),
        is_active: isActive,
      });

      if (mode === 'create') {
        await createActivityViaApi(parsed);
        toast.success(isGroup ? 'Group created' : 'Activity created');
      } else if (activity) {
        await updateActivityViaApi(activity.id, parsed);
        toast.success(isGroup ? 'Group updated' : 'Activity updated');
      }

      router.push('/taxonomy/activities');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to save ${noun}`;
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{mode === 'create' ? `Add ${noun}` : `Edit ${noun}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value.toLowerCase())}
              placeholder="dinner"
              required
              readOnly={mode === 'edit'}
              className={mode === 'edit' ? 'bg-zinc-50' : undefined}
            />
            <p className="text-xs text-zinc-500">
              Lowercase snake_case key used in APIs. {mode === 'edit' ? 'Cannot be changed after creation.' : ''}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional short description for pickers"
            />
          </div>
          {isGroup ? (
            <p className="text-sm text-zinc-500">
              {childCount
                ? `${childCount} ${childCount === 1 ? 'activity is' : 'activities are'} in this group. Turning the group off does not turn them off.`
                : 'No activities in this group yet.'}
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="parent">Group</Label>
                <select
                  id="parent"
                  value={parentId}
                  onChange={(event) => setParentId(event.target.value)}
                  required
                  className={cn(
                    'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900',
                  )}
                >
                  <option value="" disabled>
                    Choose a group
                  </option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.is_active ? group.name : `${group.name} (inactive)`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kind">Kind</Label>
                <select
                  id="kind"
                  value={kind}
                  onChange={(event) => setKind(event.target.value as ActivityKind)}
                  className={cn(
                    'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900',
                  )}
                >
                  {ACTIVITY_KINDS.map((value) => (
                    <option key={value} value={value}>
                      {ACTIVITY_KIND_LABELS[value]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-zinc-500">
                  Activities can be chosen on an event. Interests stay on the profile.
                </p>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Input
              id="icon"
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              placeholder="Optional emoji or icon key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort_order">Sort order</Label>
            <Input
              id="sort_order"
              type="number"
              min={0}
              max={9999}
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} id="active" />
            <Label htmlFor="active">Active</Label>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : mode === 'create' ? `Create ${noun}` : 'Save changes'}
            </Button>
            <Link href="/taxonomy/activities">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
