import 'server-only';

import { createNhostServerClient } from '@/lib/nhost-server';

type GraphqlBody<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export type AdminRole = 'staff_admin' | 'moderator';

export async function graphqlAsAdmin<T>(
  query: string,
  variables?: Record<string, unknown>,
  role: AdminRole = 'staff_admin',
): Promise<T> {
  const nhost = await createNhostServerClient();
  const session = nhost.getUserSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  const { body } = await nhost.graphql.request(
    { query, variables },
    {
      headers: {
        'x-hasura-role': role,
      },
    },
  );

  const parsed = body as GraphqlBody<T>;
  if (parsed.errors?.length) {
    throw new Error(parsed.errors.map((error) => error.message).join('; '));
  }

  if (!parsed.data) {
    throw new Error('GraphQL response missing data');
  }

  return parsed.data;
}
