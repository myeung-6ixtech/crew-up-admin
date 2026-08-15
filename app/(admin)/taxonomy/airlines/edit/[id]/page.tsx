import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAirlineById } from '@/lib/data/airlines';
import { AirlineEditForm } from '@/components/admin/airline-edit-form';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  if (id === 'new') {
    return { title: 'Add airline · CrewUp Admin' };
  }

  const airline = await getAirlineById(id);
  return {
    title: airline ? `${airline.name} · CrewUp Admin` : 'Airline not found · CrewUp Admin',
  };
}

export default async function AirlineEditPage({ params }: Props) {
  const { id } = await params;

  if (id === 'new') {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/taxonomy/airlines" className="text-sm text-zinc-500 hover:text-zinc-800">
            ← Back to airlines
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Add airline</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Creates a new carrier row via the Nhost GraphQL API.
          </p>
        </div>
        <AirlineEditForm airline={null} mode="create" />
      </div>
    );
  }

  const airline = await getAirlineById(id);
  if (!airline) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/taxonomy/airlines" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Back to airlines
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit {airline.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Update this carrier via the Nhost GraphQL API.
        </p>
      </div>
      <AirlineEditForm airline={airline} mode="edit" />
    </div>
  );
}
