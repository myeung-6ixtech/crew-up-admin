import { getAirlines } from '@/lib/data/airlines';
import { AirlinesList } from '@/components/admin/airlines-list';
import { parsePage } from '@/components/admin/list-pagination';

export default async function AirlinesTaxonomyPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const airlines = await getAirlines();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Airlines</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage carrier reference data and email domains used for instant airline-email verification.
          Deactivate instead of deleting carriers referenced by profiles.
        </p>
      </div>
      <AirlinesList airlines={airlines} page={parsePage(page)} />
    </div>
  );
}
