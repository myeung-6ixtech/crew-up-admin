'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Activity } from '@/lib/types/activity';
import type { PlatformEvent } from '@/lib/types/event';
import {
  createPlatformEventViaApi,
  syncPlatformEventActivitiesViaApi,
  updatePlatformEventViaApi,
} from '@/lib/api/admin-events';
import {
  parseLanguages,
  parseTags,
  platformEventSchema,
} from '@/lib/schemas/event.schema';
import { ActivityPicker } from '@/components/admin/activity-picker-dialog';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function toLocalInputValue(iso: string | null | undefined) {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function EventEditForm({
  event,
  activities,
  mode,
}: {
  event: PlatformEvent | null;
  activities: Activity[];
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [city, setCity] = useState(event?.city ?? '');
  const [venueName, setVenueName] = useState(event?.venue_name ?? '');
  const [venueAddress, setVenueAddress] = useState(event?.venue_address ?? '');
  const [startsAt, setStartsAt] = useState(toLocalInputValue(event?.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalInputValue(event?.ends_at));
  const [capacity, setCapacity] = useState(event?.capacity ? String(event.capacity) : '');
  const [languages, setLanguages] = useState(event?.languages.join(', ') ?? 'en');
  const [tags, setTags] = useState(event?.tags.join('\n') ?? '');
  const [featuredUntil, setFeaturedUntil] = useState(toLocalInputValue(event?.featured_until));
  const [isPublished, setIsPublished] = useState(event?.is_published ?? true);
  const [selectedActivities, setSelectedActivities] = useState<string[]>(
    event?.eventActivities?.map((row) => row.activity_id) ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setError(null);
    setPending(true);

    try {
      const parsed = platformEventSchema.parse({
        title,
        description: description || undefined,
        city,
        venue_name: venueName || undefined,
        venue_address: venueAddress || undefined,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
        capacity: capacity ? Number(capacity) : null,
        languages: parseLanguages(languages),
        activity_ids: selectedActivities,
        tags: parseTags(tags),
        is_published: isPublished,
        featured_until: featuredUntil ? new Date(featuredUntil).toISOString() : null,
      });

      if (mode === 'create') {
        await createPlatformEventViaApi(parsed);
        toast.success('Platform event created');
      } else if (event) {
        await updatePlatformEventViaApi(event.id, parsed);
        await syncPlatformEventActivitiesViaApi(event.id, parsed.activity_ids);
        toast.success('Platform event updated');
      }

      router.push('/events/events-list');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save event';
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create platform event' : 'Edit platform event'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="venue_name">Venue name</Label>
              <Input
                id="venue_name"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue_address">Venue address</Label>
              <Input
                id="venue_address"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="starts_at">Starts at</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends_at">Ends at</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="languages">Languages</Label>
            <Input
              id="languages"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="en, th"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Modifier tags</Label>
            <Textarea
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="alcohol_free"
            />
            <p className="text-xs text-zinc-500">Dietary/safety tags, not activity types.</p>
          </div>
          <ActivityPicker
            activities={activities}
            selectedIds={selectedActivities}
            onChange={setSelectedActivities}
          />
          <div className="space-y-2">
            <Label htmlFor="featured_until">Featured until</Label>
            <Input
              id="featured_until"
              type="datetime-local"
              value={featuredUntil}
              onChange={(e) => setFeaturedUntil(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isPublished} onCheckedChange={setIsPublished} id="published" />
            <Label htmlFor="published">Published</Label>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : mode === 'create' ? 'Create event' : 'Save changes'}
            </Button>
            <Link href="/events/events-list">
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
