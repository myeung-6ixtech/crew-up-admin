import { AccountList } from '@/components/admin/account-list';

export const metadata = { title: 'Admin management · CrewUp Admin' };

export default async function AdminManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;

  return (
    <AccountList
      title="Admin management"
      description="Dashboard accounts. A moderator or staff_admin can sign in here. App accounts stay on Users."
      audience="staff"
      basePath="/admin-management"
      search={params.q ?? ''}
    />
  );
}
