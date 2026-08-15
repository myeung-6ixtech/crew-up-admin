import 'server-only';

import { createServerClient, type NhostClient } from '@nhost/nhost-js';
import type { StoredSession } from '@nhost/nhost-js/session';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_OPTIONS } from '@/lib/auth/session';
import { env } from '@/lib/env';
import { NHOST_SESSION_KEY, parseStoredSession } from '@/lib/nhost-cookie-storage';

function createSessionStorage(
  read: () => StoredSession | null,
  write: (value: StoredSession) => void,
  remove: () => void,
) {
  return { get: read, set: write, remove };
}

export async function createNhostServerClient() {
  const cookieStore = await cookies();
  let requestSession = parseStoredSession(cookieStore.get(NHOST_SESSION_KEY)?.value);

  return createServerClient({
    subdomain: env.NEXT_PUBLIC_NHOST_SUBDOMAIN,
    region: env.NEXT_PUBLIC_NHOST_REGION,
    authUrl: env.NEXT_PUBLIC_NHOST_AUTH_URL,
    graphqlUrl: env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
    storageUrl: env.NEXT_PUBLIC_NHOST_STORAGE_URL,
    functionsUrl: env.NEXT_PUBLIC_NHOST_FUNCTIONS_URL,
    storage: createSessionStorage(
      () => requestSession,
      (value) => {
        requestSession = value;
        try {
          cookieStore.set(NHOST_SESSION_KEY, JSON.stringify(value), SESSION_COOKIE_OPTIONS);
        } catch {
          // Server Components cannot always persist cookies; in-memory is enough for this request.
        }
      },
      () => {
        requestSession = null;
        try {
          cookieStore.delete(NHOST_SESSION_KEY);
        } catch {
          // Ignore when cookie mutation is not allowed in this context.
        }
      },
    ),
  });
}

export async function ensureServerSession(): Promise<{
  nhost: NhostClient;
  session: StoredSession | null;
}> {
  const nhost = await createNhostServerClient();
  const session = await nhost.refreshSession();
  return { nhost, session };
}
