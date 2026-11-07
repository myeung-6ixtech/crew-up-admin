import 'server-only';

import { graphqlAsAdmin } from '@/lib/data/graphql';
import type { PlatformEvent } from '@/lib/types/event';
import type { PlatformEventInput } from '@/lib/schemas/event.schema';

export type { PlatformEvent };

const LIST_PLATFORM_EVENTS_QUERY = `
  query ListPlatformEvents($now: timestamptz!) {
    events(
      where: { host_type: { _eq: platform }, starts_at: { _gte: $now } }
      order_by: [{ featured_until: desc_nulls_last }, { starts_at: asc }]
    ) {
      id
      title
      city
      starts_at
      ends_at
      capacity
      host_type
      is_published
      featured_until
      created_at
      attendees_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

const GET_PLATFORM_EVENT_QUERY = `
  query GetPlatformEvent($id: uuid!) {
    events_by_pk(id: $id) {
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
      attendees_aggregate {
        aggregate {
          count
        }
      }
      eventActivities {
        activity_id
        activity {
          id
          slug
          name
          icon
        }
      }
    }
  }
`;

export async function getPlatformEvents(): Promise<PlatformEvent[]> {
  const data = await graphqlAsAdmin<{ events: PlatformEvent[] }>(LIST_PLATFORM_EVENTS_QUERY, {
    now: new Date().toISOString(),
  });
  return data.events;
}

export async function getPlatformEventById(id: string): Promise<PlatformEvent | null> {
  const data = await graphqlAsAdmin<{ events_by_pk: PlatformEvent | null }>(
    GET_PLATFORM_EVENT_QUERY,
    { id },
  );
  const event = data.events_by_pk;
  if (!event || event.host_type !== 'platform') {
    return null;
  }
  return event;
}

export async function updatePlatformEvent(
  id: string,
  input: PlatformEventInput,
  actorId: string,
) {
  const publishedAt = input.is_published ? new Date().toISOString() : null;
  const data = await graphqlAsAdmin<{ update_events_by_pk: PlatformEvent | null }>(
    `
      mutation UpdatePlatformEvent($id: uuid!, $set: events_set_input!) {
        update_events_by_pk(pk_columns: { id: $id }, _set: $set) {
          id
          title
          is_published
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

  console.info(
    JSON.stringify({
      event: 'admin.platform_event.updated',
      actorId,
      eventId: id,
      at: new Date().toISOString(),
    }),
  );

  return data.update_events_by_pk;
}

export type EventAnalytics = {
  totalEvents: number;
  totalRsvps: number;
  publishedEvents: number;
  upcomingEvents: number;
  platformEvents: number;
  userHostedEvents: number;
};

export async function getEventAnalytics(): Promise<EventAnalytics> {
  const data = await graphqlAsAdmin<{
    eventsAggregate: { aggregate: { count: number } | null };
    rsvpsAggregate: { aggregate: { count: number } | null };
    publishedAggregate: { aggregate: { count: number } | null };
    upcomingAggregate: { aggregate: { count: number } | null };
    platformAggregate: { aggregate: { count: number } | null };
    userHostedAggregate: { aggregate: { count: number } | null };
  }>(
    `
      query EventAnalytics($now: timestamptz!) {
        eventsAggregate: events_aggregate { aggregate { count } }
        rsvpsAggregate: event_attendees_aggregate { aggregate { count } }
        publishedAggregate: events_aggregate(where: { is_published: { _eq: true } }) { aggregate { count } }
        upcomingAggregate: events_aggregate(
          where: { starts_at: { _gte: $now }, cancelled_at: { _is_null: true } }
        ) { aggregate { count } }
        platformAggregate: events_aggregate(where: { host_type: { _eq: platform } }) { aggregate { count } }
        userHostedAggregate: events_aggregate(where: { host_type: { _eq: user } }) { aggregate { count } }
      }
    `,
    { now: new Date().toISOString() },
  );

  const countOf = (value: { aggregate: { count: number } | null }) => value.aggregate?.count ?? 0;
  return {
    totalEvents: countOf(data.eventsAggregate),
    totalRsvps: countOf(data.rsvpsAggregate),
    publishedEvents: countOf(data.publishedAggregate),
    upcomingEvents: countOf(data.upcomingAggregate),
    platformEvents: countOf(data.platformAggregate),
    userHostedEvents: countOf(data.userHostedAggregate),
  };
}
