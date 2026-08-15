'use server';

import { revalidatePath } from 'next/cache';
import { requireAuthSession, requireStaffAdmin } from '@/lib/data/auth';
import { grantRole, revokeRole, setUserDisabled } from '@/lib/data/users';

export async function toggleUserDisabledAction(userId: string, disabled: boolean) {
  const session = await requireStaffAdmin();
  if (session.userId === userId) {
    throw new Error('You cannot disable your own account');
  }
  await setUserDisabled(userId, disabled, session.userId);
  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
}

export async function grantRoleAction(userId: string, role: 'moderator' | 'staff_admin') {
  const session = await requireStaffAdmin();
  await grantRole(userId, role, session.userId);
  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
}

export async function revokeRoleAction(
  roleId: string,
  userId: string,
  role: string,
) {
  const session = await requireStaffAdmin();
  if (session.userId === userId && role === 'staff_admin') {
    throw new Error('You cannot revoke your own staff_admin role');
  }
  await revokeRole(roleId, session.userId, userId, role);
  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
}

export async function assertAdminSession() {
  return requireAuthSession();
}
