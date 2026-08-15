import 'client-only';

import { createClient } from '@nhost/nhost-js';
import { env } from '@/lib/env';
import { createCookieStorage } from '@/lib/nhost-cookie-storage';

export const nhostBrowser = createClient({
  subdomain: env.NEXT_PUBLIC_NHOST_SUBDOMAIN,
  region: env.NEXT_PUBLIC_NHOST_REGION,
  authUrl: env.NEXT_PUBLIC_NHOST_AUTH_URL,
  graphqlUrl: env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
  storageUrl: env.NEXT_PUBLIC_NHOST_STORAGE_URL,
  functionsUrl: env.NEXT_PUBLIC_NHOST_FUNCTIONS_URL,
  storage: createCookieStorage(),
});
