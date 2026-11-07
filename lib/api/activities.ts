import 'client-only';

import type { ActivityInput } from '@/lib/schemas/activity.schema';
import type { Activity } from '@/lib/types/activity';
import { nhostGraphqlRequest } from '@/lib/api/nhost-graphql';

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

function normalizeInput(input: ActivityInput) {
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

function friendlyError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('ACTIVITY_GROUP_HAS_CHILDREN')) {
    return new Error('This group still has activities. Move them to another group first.');
  }
  if (message.includes('ACTIVITY_PARENT_NOT_GROUP') || message.includes('ACTIVITY_PARENT_SELF')) {
    return new Error('Pick a group as the parent.');
  }
  return error instanceof Error ? error : new Error(message);
}

export async function createActivityViaApi(input: ActivityInput): Promise<Activity> {
  let data: { insert_activities_one: Activity | null };
  try {
    data = await nhostGraphqlRequest<{ insert_activities_one: Activity | null }>(
      `
        mutation CreateActivity($object: activities_insert_input!) {
          insert_activities_one(object: $object) { ${ACTIVITY_FIELDS} }
        }
      `,
      { object: normalizeInput(input) },
    );
  } catch (error) {
    throw friendlyError(error);
  }

  if (!data.insert_activities_one) {
    throw new Error('Failed to create activity');
  }

  return data.insert_activities_one;
}

export async function updateActivityViaApi(id: string, input: ActivityInput): Promise<Activity> {
  let data: { update_activities_by_pk: Activity | null };
  try {
    data = await nhostGraphqlRequest<{ update_activities_by_pk: Activity | null }>(
      `
        mutation UpdateActivity($id: uuid!, $set: activities_set_input!) {
          update_activities_by_pk(pk_columns: { id: $id }, _set: $set) { ${ACTIVITY_FIELDS} }
        }
      `,
      { id, set: normalizeInput(input) },
    );
  } catch (error) {
    throw friendlyError(error);
  }

  if (!data.update_activities_by_pk) {
    throw new Error('Failed to update activity');
  }

  return data.update_activities_by_pk;
}
