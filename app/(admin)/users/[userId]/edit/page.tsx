import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { UserEditForm } from '@/components/admin/user-edit-form';
import { accountPageTitle } from '@/components/admin/account-detail';
import { getBaseAirports } from '@/lib/data/airports';
import { getAirlines } from '@/lib/data/airlines';
import { getAuthSession } from '@/lib/data/auth';
import { getUserById } from '@/lib/data/users';

type Props = {
  params: Promise<{ userId: string }>;
};

const STAFF_ROLES = new Set(['moderator', 'staff_admin']);

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  return accountPageTitle(userId, 'Edit customer');
}

export default async function EditCustomerPage({ params }: Props) {
  const { userId } = await params;
  const session = await getAuthSession();
  if (!session || session.role !== 'staff_admin') {
    redirect(`/users/${userId}`);
  }

  let user;
  try {
    user = await getUserById(userId);
  } catch {
    notFound();
  }
  if (!user) notFound();

  if (user.roles.some((entry) => STAFF_ROLES.has(entry.role))) {
    redirect(`/admin-management/${userId}`);
  }

  const [airlines, airports] = await Promise.all([getAirlines(), getBaseAirports()]);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/users/${userId}`} className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Back to user
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit {user.profile?.display_name || user.displayName || user.email}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          These values replace what the customer has on their profile.
        </p>
      </div>
      {user.profile ? (
        <UserEditForm user={user} airlines={airlines} airports={airports} />
      ) : (
        <p className="text-sm text-zinc-500">This account has no profile yet, so there is nothing to override.</p>
      )}
    </div>
  );
}
