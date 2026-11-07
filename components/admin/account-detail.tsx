import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAuthSession } from '@/lib/data/auth';
import { getUserById } from '@/lib/data/users';
import { UserDetailPanel } from '@/components/admin/user-detail-panel';

export async function accountPageTitle(userId: string, suffix: string) {
  try {
    const user = await getUserById(userId);
    const name = user?.profile?.display_name || user?.displayName || user?.email;
    return { title: name ? `${name} · ${suffix}` : `Account not found · ${suffix}` };
  } catch {
    return { title: `Account not found · ${suffix}` };
  }
}

export async function AccountDetail({
  userId,
  title,
  description,
  backHref,
  backLabel,
}: {
  userId: string;
  title?: string;
  description?: string;
  backHref: '/users' | '/admin-management';
  backLabel: string;
}) {
  const staffRoles = new Set(['moderator', 'staff_admin']);
  const session = await getAuthSession();
  if (!session) notFound();

  let user;
  try {
    user = await getUserById(userId);
  } catch {
    notFound();
  }
  if (!user) notFound();

  const isDashboardAccount = user.roles.some((entry) => staffRoles.has(entry.role));
  const editHref =
    backHref === '/users' && session.role === 'staff_admin' && !isDashboardAccount
      ? `/users/${user.id}/edit`
      : undefined;

  return (
    <div className="space-y-6">
      <div>
        <Link href={backHref} className="text-sm text-zinc-500 hover:text-zinc-800">
          ← {backLabel}
        </Link>
        {title ? <h1 className="mt-2 text-2xl font-semibold">{title}</h1> : null}
        {description ? <p className="mt-2 text-sm text-zinc-500">{description}</p> : null}
      </div>
      <UserDetailPanel
        user={user}
        currentUserId={session.userId}
        canManageRoles={session.role === 'staff_admin'}
        editHref={editHref}
      />
    </div>
  );
}
