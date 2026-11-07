'use server';

import { revalidatePath } from 'next/cache';
import { requireAuthSession, requireStaffAdmin } from '@/lib/data/auth';
import { customerProfileSchema, type CustomerProfileInput } from '@/lib/schemas/customer-profile.schema';
import { grantRole, revokeRole, setUserDisabled, updateCustomerProfile } from '@/lib/data/users';

function revalidateAccount(userId: string) {
  revalidatePath('/users');
  revalidatePath('/admin-management');
  revalidatePath(`/users/${userId}`);
  revalidatePath(`/users/${userId}/edit`);
  revalidatePath(`/admin-management/${userId}`);
}

export async function toggleUserDisabledAction(userId: string, disabled: boolean) {
  const session = await requireStaffAdmin();
  if (session.userId === userId) {
    throw new Error('You cannot disable your own account');
  }
  await setUserDisabled(userId, disabled, session.userId);
  revalidateAccount(userId);
}

export async function grantRoleAction(userId: string, role: 'moderator' | 'staff_admin') {
  const session = await requireStaffAdmin();
  await grantRole(userId, role, session.userId);
  revalidateAccount(userId);
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
  revalidateAccount(userId);
}

export async function updateCustomerProfileAction(userId: string, input: CustomerProfileInput) {
  const session = await requireStaffAdmin();
  const parsed = customerProfileSchema.parse(input);
  try {
    const updated = await updateCustomerProfile(userId, parsed, session.userId);
    if (!updated) {
      throw new Error('This account has no profile to update');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    if (/username/i.test(message) && /unique|duplicate/i.test(message)) {
      throw new Error('That username is already taken');
    }
    throw error;
  }
  revalidateAccount(userId);
}

export async function assertAdminSession() {
  return requireAuthSession();
}
