import { Suspense } from 'react';
import { getUsers } from '@/lib/data/users';
import { UsersTable } from '@/components/admin/users-table';
import { Skeleton } from '@/components/ui/skeleton';

async function UsersContent({ search }: { search: string }) {
  const { users, total } = await getUsers({ search });
  return <UsersTable users={users} total={total} search={search} />;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const search = params.q ?? '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Search accounts, review roles, and disable access.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <UsersContent search={search} />
      </Suspense>
    </div>
  );
}
