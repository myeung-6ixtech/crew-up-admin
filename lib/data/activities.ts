import 'server-only';

import { graphqlAsAdmin } from '@/lib/data/graphql';
import type { ActivityInput } from '@/lib/schemas/activity.schema';
import type { Activity } from '@/lib/types/activity';

export type { Activity };

const LIST_ACTIVITIES_QUERY = `
  query ListActivities {
    activities(order_by: [{ sort_order: asc }, { name: asc }]) {
      id
      slug
      name
      description
      category
      icon
      sort_order
      is_active
      created_at
      updated_at
    }
  }
`;

const GET_ACTIVITY_QUERY = `
  query GetActivity($id: uuid!) {
    activities_by_pk(id: $id) {
      id
      slug
      name
      description
      category
      icon
      sort_order
      is_active
      created_at
      updated_at
    }
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

export async function createActivity(input: ActivityInput, actorId: string) {
  const data = await graphqlAsAdmin<{ insert_activities_one: Activity | null }>(
    `
      mutation CreateActivity($object: activities_insert_input!) {
        insert_activities_one(object: $object) {
          id
          slug
          name
          description
          category
          icon
          sort_order
          is_active
        }
      }
    `,
    {
      object: {
        slug: input.slug.toLowerCase(),
        name: input.name,
        description: input.description || null,
        category: input.category,
        icon: input.icon || null,
        sort_order: input.sort_order,
        is_active: input.is_active,
      },
    },
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
        update_activities_by_pk(pk_columns: { id: $id }, _set: $set) {
          id
          slug
          name
          description
          category
          icon
          sort_order
          is_active
        }
      }
    `,
    {
      id,
      set: {
        slug: input.slug.toLowerCase(),
        name: input.name,
        description: input.description || null,
        category: input.category,
        icon: input.icon || null,
        sort_order: input.sort_order,
        is_active: input.is_active,
      },
    },
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
