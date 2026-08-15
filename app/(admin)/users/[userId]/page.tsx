import { notFound } from 'next/navigation';
import { getAuthSession } from '@/lib/data/auth';
import { getUserById } from '@/lib/data/users';
import { UserDetailPanel } from '@/components/admin/user-detail-panel';

type Props = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  try {
    const user = await getUserById(userId);
    const name = user.profile?.display_name || user.displayName || user.email;
    return { title: `${name} · CrewUp Admin` };
  } catch {
    return { title: 'User not found · CrewUp Admin' };
  }
}

export default async function UserDetailPage({ params }: Props) {
  const { userId } = await params;
  const session = await getAuthSession();
  if (!session) notFound();

  let user;
  try {
    user = await getUserById(userId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">User detail</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage account access and staff roles.</p>
      </div>
      <UserDetailPanel
        user={user}
        currentUserId={session.userId}
        canManageRoles={session.role === 'staff_admin'}
      />
    </div>
  );
}
