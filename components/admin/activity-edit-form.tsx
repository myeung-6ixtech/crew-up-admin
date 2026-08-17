'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Activity } from '@/lib/types/activity';
import { createActivityViaApi, updateActivityViaApi } from '@/lib/api/activities';
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_CATEGORY_LABELS,
  activitySchema,
  type ActivityCategory,
} from '@/lib/schemas/activity.schema';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function ActivityEditForm({
  activity,
  mode,
}: {
  activity: Activity | null;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(activity?.slug ?? '');
  const [name, setName] = useState(activity?.name ?? '');
  const [description, setDescription] = useState(activity?.description ?? '');
  const [category, setCategory] = useState<ActivityCategory>(
    (activity?.category as ActivityCategory) ?? 'general',
  );
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
      const parsed = activitySchema.parse({
        slug,
        name,
        description: description || undefined,
        category,
        icon: icon || undefined,
        sort_order: Number(sortOrder),
        is_active: isActive,
      });

      if (mode === 'create') {
        await createActivityViaApi(parsed);
        toast.success('Activity created');
      } else if (activity) {
        await updateActivityViaApi(activity.id, parsed);
        toast.success('Activity updated');
      }

      router.push('/taxonomy/activities');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save activity';
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Add activity' : 'Edit activity'}</CardTitle>
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
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(event) => setCategory(event.target.value as ActivityCategory)}
              className={cn(
                'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900',
              )}
            >
              {ACTIVITY_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {ACTIVITY_CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
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
              {pending ? 'Saving…' : mode === 'create' ? 'Create activity' : 'Save changes'}
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
