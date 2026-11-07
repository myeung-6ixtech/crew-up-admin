import { AccountList } from '@/components/admin/account-list';

export const metadata = { title: 'Users · CrewUp Admin' };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;

  return (
    <AccountList
      title="Users"
      description="App accounts. People with moderator or staff_admin are listed under Admin management, because those roles sign in to this dashboard."
      audience="app"
      basePath="/users"
      search={params.q ?? ''}
    />
  );
}
