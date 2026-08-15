import 'server-only';

import { createServerClient } from '@nhost/nhost-js';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { NHOST_SESSION_KEY, parseStoredSession } from '@/lib/nhost-cookie-storage';

export async function createNhostServerClient() {
  const cookieStore = await cookies();

  return createServerClient({
    subdomain: env.NEXT_PUBLIC_NHOST_SUBDOMAIN,
    region: env.NEXT_PUBLIC_NHOST_REGION,
    authUrl: env.NEXT_PUBLIC_NHOST_AUTH_URL,
    graphqlUrl: env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
    storageUrl: env.NEXT_PUBLIC_NHOST_STORAGE_URL,
    functionsUrl: env.NEXT_PUBLIC_NHOST_FUNCTIONS_URL,
    storage: {
      get: () => parseStoredSession(cookieStore.get(NHOST_SESSION_KEY)?.value),
      set: (value) => {
        cookieStore.set(NHOST_SESSION_KEY, JSON.stringify(value), {
          path: '/',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
      },
      remove: () => {
        cookieStore.delete(NHOST_SESSION_KEY);
      },
    },
  });
}
