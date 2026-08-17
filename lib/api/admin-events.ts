import 'client-only';

import axios from 'axios';
import { nhostBrowser } from '@/lib/nhost-client';
import { env } from '@/lib/env';
import type { PlatformEventInput } from '@/lib/schemas/event.schema';
import type { PlatformEvent } from '@/lib/types/event';
import { nhostGraphqlRequest } from '@/lib/api/nhost-graphql';

function getFunctionsBaseUrl() {
  if (env.NEXT_PUBLIC_NHOST_FUNCTIONS_URL) {
    return env.NEXT_PUBLIC_NHOST_FUNCTIONS_URL.replace(/\/$/, '');
  }
  return `https://${env.NEXT_PUBLIC_NHOST_SUBDOMAIN}.functions.${env.NEXT_PUBLIC_NHOST_REGION}.nhost.run/v1`;
}

export async function createPlatformEventViaApi(
  input: PlatformEventInput,
): Promise<{ event_id: string; thread_id: string | null }> {
  const session = await nhostBrowser.refreshSession();
  if (!session?.accessToken) {
    throw new Error('Not authenticated');
  }

  const { data } = await axios.post<{ event_id: string; thread_id: string | null }>(
    `${getFunctionsBaseUrl()}/admin/events/create`,
    input,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
    },
  );

  return data;
}

export async function updatePlatformEventViaApi(
  id: string,
  input: PlatformEventInput,
): Promise<PlatformEvent> {
  const publishedAt = input.is_published ? new Date().toISOString() : null;
  const data = await nhostGraphqlRequest<{ update_events_by_pk: PlatformEvent | null }>(
    `
      mutation UpdatePlatformEvent($id: uuid!, $set: events_set_input!) {
        update_events_by_pk(pk_columns: { id: $id }, _set: $set) {
          id
          title
          description
          city
          venue_name
          venue_address
          starts_at
          ends_at
          capacity
          visibility_scope
          tags
          languages
          host_type
          is_published
          published_at
          featured_until
          creator_id
          created_at
          updated_at
        }
      }
    `,
    {
      id,
      set: {
        title: input.title,
        description: input.description || null,
        city: input.city,
        venue_name: input.venue_name || null,
        venue_address: input.venue_address || null,
        starts_at: input.starts_at,
        ends_at: input.ends_at || null,
        capacity: input.capacity ?? null,
        tags: input.tags,
        languages: input.languages,
        is_published: input.is_published,
        published_at: publishedAt,
        featured_until: input.featured_until || null,
      },
    },
  );

  if (!data.update_events_by_pk) {
    throw new Error('Failed to update event');
  }

  return data.update_events_by_pk;
}

export async function syncPlatformEventActivitiesViaApi(
  eventId: string,
  activityIds: string[],
): Promise<void> {
  const existing = await nhostGraphqlRequest<{
    event_activities: Array<{ activity_id: string }>;
  }>(
    `
      query EventActivities($eventId: uuid!) {
        event_activities(where: { event_id: { _eq: $eventId } }) {
          activity_id
        }
      }
    `,
    { eventId },
  );

  const currentIds = new Set(existing.event_activities.map((row) => row.activity_id));
  const nextIds = new Set(activityIds);
  const toAdd = activityIds.filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !nextIds.has(id));

  if (toAdd.length) {
    await nhostGraphqlRequest(
      `
        mutation AddEventActivities($objects: [event_activities_insert_input!]!) {
          insert_event_activities(objects: $objects) {
            affected_rows
          }
        }
      `,
      {
        objects: toAdd.map((activityId) => ({
          event_id: eventId,
          activity_id: activityId,
        })),
      },
    );
  }

  if (toRemove.length) {
    await nhostGraphqlRequest(
      `
        mutation RemoveEventActivities($eventId: uuid!, $activityIds: [uuid!]!) {
          delete_event_activities(
            where: { event_id: { _eq: $eventId }, activity_id: { _in: $activityIds } }
          ) {
            affected_rows
          }
        }
      `,
      { eventId, activityIds: toRemove },
    );
  }
}
