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

/** Set when the user checks "Remember for the next 48 hours" on the login form. Value is an expiry timestamp in ms. */
export const REMEMBER_COOKIE = 'crewupAdminRemember';
export const REMEMBER_FOR_MS = 48 * 60 * 60 * 1000;

export function sessionCookieOptions(rememberUntil: string | undefined) {
  const until = Number(rememberUntil);
  if (!Number.isFinite(until) || until <= Date.now()) {
    return SESSION_COOKIE_OPTIONS;
  }
  return {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: Math.max(1, Math.floor((until - Date.now()) / 1000)),
  };
}
