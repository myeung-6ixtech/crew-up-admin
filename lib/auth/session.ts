import type { StoredSession } from '@nhost/nhost-js/session';

export const HASURA_CLAIMS_KEY = 'https://hasura.io/jwt/claims';

export type AdminRole = 'staff_admin' | 'moderator';

export function getAdminRoleFromSession(
  session: StoredSession | null | undefined,
): AdminRole | null {
  if (!session?.decodedToken) return null;

  const claims = session.decodedToken[HASURA_CLAIMS_KEY] as
    | Record<string, string | string[]>
    | undefined;
  const allowedRoles = Array.isArray(claims?.['x-hasura-allowed-roles'])
    ? claims['x-hasura-allowed-roles']
    : typeof claims?.['x-hasura-allowed-roles'] === 'string'
      ? [claims['x-hasura-allowed-roles']]
      : undefined;

  if (!allowedRoles) return null;
  if (allowedRoles.includes('staff_admin')) return 'staff_admin';
  if (allowedRoles.includes('moderator')) return 'moderator';
  return null;
}

export const SESSION_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};
