import 'server-only';

import { graphqlAsAdmin } from '@/lib/data/graphql';
import type { ActivityInput } from '@/lib/schemas/activity.schema';
import type { Activity } from '@/lib/types/activity';

export type { Activity };

const ACTIVITY_FIELDS = `
  id
  slug
  name
  description
  category
  parent_id
  kind
  icon
  sort_order
  is_active
  created_at
  updated_at
`;

const LIST_ACTIVITIES_QUERY = `
  query ListActivities {
    activities(order_by: [{ sort_order: asc }, { name: asc }]) { ${ACTIVITY_FIELDS} }
  }
`;

const GET_ACTIVITY_QUERY = `
  query GetActivity($id: uuid!) {
    activities_by_pk(id: $id) { ${ACTIVITY_FIELDS} }
  }
`;

export async function getActivities(): Promise<Activity[]> {
  const data = await graphqlAsAdmin<{ activities: Activity[] }>(LIST_ACTIVITIES_QUERY);
  return data.activities;
}

export async function getActivityById(id: string): Promise<Activity | null> {
  const data = await graphqlAsAdmin<{ activities_by_pk: Activity | null }>(GET_ACTIVITY_QUERY, { id });
  return data.activities_by_pk;
}

function toRow(input: ActivityInput) {
  return {
    slug: input.slug.toLowerCase(),
    name: input.name,
    description: input.description || null,
    parent_id: input.parent_id,
    kind: input.parent_id ? input.kind : 'activity',
    icon: input.icon || null,
    sort_order: input.sort_order,
    is_active: input.is_active,
  };
}

export async function createActivity(input: ActivityInput, actorId: string) {
  const data = await graphqlAsAdmin<{ insert_activities_one: Activity | null }>(
    `
      mutation CreateActivity($object: activities_insert_input!) {
        insert_activities_one(object: $object) { ${ACTIVITY_FIELDS} }
      }
    `,
    { object: toRow(input) },
  );

  console.info(
    JSON.stringify({
      event: 'admin.activity.created',
      actorId,
      activityId: data.insert_activities_one?.id,
      slug: input.slug,
      at: new Date().toISOString(),
    }),
  );

  return data.insert_activities_one;
}

export async function updateActivity(id: string, input: ActivityInput, actorId: string) {
  const data = await graphqlAsAdmin<{ update_activities_by_pk: Activity | null }>(
    `
      mutation UpdateActivity($id: uuid!, $set: activities_set_input!) {
        update_activities_by_pk(pk_columns: { id: $id }, _set: $set) { ${ACTIVITY_FIELDS} }
      }
    `,
    { id, set: toRow(input) },
  );

  console.info(
    JSON.stringify({
      event: 'admin.activity.updated',
      actorId,
      activityId: id,
      at: new Date().toISOString(),
    }),
  );

  return data.update_activities_by_pk;
}

export async function getActivityUsageCounts(): Promise<
  Record<string, { event_count: number; preference_count: number }>
> {
  const data = await graphqlAsAdmin<{
    event_activities: Array<{ activity_id: string }>;
    profile_activity_preferences: Array<{ activity_id: string }>;
  }>(
    `
      query ActivityUsage {
        event_activities {
          activity_id
        }
        profile_activity_preferences {
          activity_id
        }
      }
    `,
  );

  const counts: Record<string, { event_count: number; preference_count: number }> = {};

  for (const row of data.event_activities) {
    const current = counts[row.activity_id] ?? { event_count: 0, preference_count: 0 };
    current.event_count += 1;
    counts[row.activity_id] = current;
  }

  for (const row of data.profile_activity_preferences) {
    const current = counts[row.activity_id] ?? { event_count: 0, preference_count: 0 };
    current.preference_count += 1;
    counts[row.activity_id] = current;
  }

  return counts;
}
