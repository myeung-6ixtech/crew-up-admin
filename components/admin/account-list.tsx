import { Suspense } from 'react';
import { getUsers, type UserAudience } from '@/lib/data/users';
import { UsersTable } from '@/components/admin/users-table';
import { Skeleton } from '@/components/ui/skeleton';

async function AccountListContent({
  search,
  audience,
  basePath,
}: {
  search: string;
  audience: UserAudience;
  basePath: '/users' | '/admin-management';
}) {
  const { users, total } = await getUsers({ search, audience });
  return <UsersTable key={basePath} users={users} total={total} search={search} basePath={basePath} />;
}

export function AccountList({
  title,
  description,
  audience,
  basePath,
  search,
}: {
  title: string;
  description: string;
  audience: UserAudience;
  basePath: '/users' | '/admin-management';
  search: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AccountListContent search={search} audience={audience} basePath={basePath} />
      </Suspense>
    </div>
  );
}
