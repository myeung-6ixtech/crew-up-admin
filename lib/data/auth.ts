import 'server-only';

import { createNhostServerClient } from '@/lib/nhost-server';
import type { AdminRole } from '@/lib/data/graphql';

const HASURA_CLAIMS_KEY = 'https://hasura.io/jwt/claims';

export type AuthSession = {
  userId: string;
  email: string;
  displayName: string;
  role: AdminRole;
};

function resolveAdminRole(allowedRoles: string[] | undefined): AdminRole | null {
  if (!allowedRoles) return null;
  if (allowedRoles.includes('staff_admin')) return 'staff_admin';
  if (allowedRoles.includes('moderator')) return 'moderator';
  return null;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const nhost = await createNhostServerClient();
  const session = nhost.getUserSession();
  if (!session) return null;

  const claims = session.decodedToken?.[HASURA_CLAIMS_KEY] as
    | Record<string, string | string[]>
    | undefined;
  const allowedRoles = Array.isArray(claims?.['x-hasura-allowed-roles'])
    ? claims['x-hasura-allowed-roles']
    : typeof claims?.['x-hasura-allowed-roles'] === 'string'
      ? [claims['x-hasura-allowed-roles']]
      : undefined;

  const role = resolveAdminRole(allowedRoles);
  if (!role) return null;

  return {
    userId: session.user!.id,
    email: session.user!.email ?? '',
    displayName: session.user!.displayName ?? session.user!.email ?? 'Admin',
    role,
  };
}

export async function requireAuthSession(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireStaffAdmin(): Promise<AuthSession> {
  const session = await requireAuthSession();
  if (session.role !== 'staff_admin') {
    throw new Error('Staff admin role required');
  }
  return session;
}
