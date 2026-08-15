import 'server-only';

import { getAdminRoleFromSession, type AdminRole } from '@/lib/auth/session';
import { ensureServerSession } from '@/lib/nhost-server';

export type AuthSession = {
  userId: string;
  email: string;
  displayName: string;
  role: AdminRole;
};

export async function getAuthSession(): Promise<AuthSession | null> {
  const { session } = await ensureServerSession();
  if (!session) return null;

  const role = getAdminRoleFromSession(session);
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
