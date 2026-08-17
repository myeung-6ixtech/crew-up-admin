import 'client-only';

import type { ActivityInput } from '@/lib/schemas/activity.schema';
import type { Activity } from '@/lib/types/activity';
import { nhostGraphqlRequest } from '@/lib/api/nhost-graphql';

function normalizeInput(input: ActivityInput) {
  return {
    slug: input.slug.toLowerCase(),
    name: input.name,
    description: input.description || null,
    category: input.category,
    icon: input.icon || null,
    sort_order: input.sort_order,
    is_active: input.is_active,
  };
}

export async function createActivityViaApi(input: ActivityInput): Promise<Activity> {
  const data = await nhostGraphqlRequest<{ insert_activities_one: Activity | null }>(
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
          created_at
          updated_at
        }
      }
    `,
    { object: normalizeInput(input) },
  );

  if (!data.insert_activities_one) {
    throw new Error('Failed to create activity');
  }

  return data.insert_activities_one;
}

export async function updateActivityViaApi(id: string, input: ActivityInput): Promise<Activity> {
  const data = await nhostGraphqlRequest<{ update_activities_by_pk: Activity | null }>(
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
          created_at
          updated_at
        }
      }
    `,
    { id, set: normalizeInput(input) },
  );

  if (!data.update_activities_by_pk) {
    throw new Error('Failed to update activity');
  }

  return data.update_activities_by_pk;
}
