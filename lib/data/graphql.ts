import 'server-only';

import type { AdminRole } from '@/lib/auth/session';
import { ensureServerSession } from '@/lib/nhost-server';

type GraphqlBody<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export type { AdminRole };

function isJwtExpiredError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes('JWTExpired') || error.message.includes('Could not verify JWT');
}

async function executeGraphql<T>(
  nhost: Awaited<ReturnType<typeof ensureServerSession>>['nhost'],
  query: string,
  variables: Record<string, unknown> | undefined,
  role: AdminRole,
): Promise<T> {
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

export async function graphqlAsAdmin<T>(
  query: string,
  variables?: Record<string, unknown>,
  role: AdminRole = 'staff_admin',
): Promise<T> {
  const { nhost, session: initialSession } = await ensureServerSession();
  let session = initialSession;
  if (!session) {
    throw new Error('Not authenticated');
  }

  try {
    return await executeGraphql<T>(nhost, query, variables, role);
  } catch (error) {
    if (!isJwtExpiredError(error)) {
      throw error;
    }

    session = await nhost.refreshSession(0);
    if (!session) {
      throw new Error('Session expired');
    }

    return executeGraphql<T>(nhost, query, variables, role);
  }
}
