import 'client-only';

import axios from 'axios';
import { nhostBrowser } from '@/lib/nhost-client';

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

function isJwtExpiredError(message: string): boolean {
  return message.includes('JWTExpired') || message.includes('Could not verify JWT');
}

export async function nhostGraphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  let session = await nhostBrowser.refreshSession();
  if (!session?.accessToken) {
    throw new Error('Not authenticated');
  }

  async function post(currentSession: NonNullable<typeof session>) {
    const { data } = await axios.post<GraphqlResponse<T>>(
      nhostBrowser.graphql.url,
      { query, variables },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentSession.accessToken}`,
          'x-hasura-role': 'staff_admin',
        },
      },
    );

    if (data.errors?.length) {
      throw new Error(data.errors.map((error) => error.message).join('; '));
    }

    if (!data.data) {
      throw new Error('GraphQL response missing data');
    }

    return data.data;
  }

  try {
    return await post(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (!isJwtExpiredError(message)) {
      throw error;
    }

    session = await nhostBrowser.refreshSession(0);
    if (!session?.accessToken) {
      throw new Error('Session expired');
    }

    return post(session);
  }
}
