import 'client-only';

import axios from 'axios';
import { nhostBrowser } from '@/lib/nhost-client';

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export async function nhostGraphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const session = nhostBrowser.getUserSession();
  if (!session?.accessToken) {
    throw new Error('Not authenticated');
  }

  const { data } = await axios.post<GraphqlResponse<T>>(
    nhostBrowser.graphql.url,
    { query, variables },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
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
