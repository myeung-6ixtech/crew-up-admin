'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { updateCustomerProfileAction } from '@/app/(admin)/users/actions';
import type { BaseAirport } from '@/lib/data/airports';
import type { AdminUser } from '@/lib/data/users';
import type { Airline } from '@/lib/types/airline';
import { CREW_ROLE_LABELS, CREW_ROLES, customerProfileSchema } from '@/lib/schemas/customer-profile.schema';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const selectClassName =
  'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900';

export function UserEditForm({
  user,
  airlines,
  airports,
}: {
  user: AdminUser;
  airlines: Airline[];
  airports: BaseAirport[];
}) {
  const router = useRouter();
  const profile = user.profile;
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [fullNameNative, setFullNameNative] = useState(profile?.full_name_native ?? '');
  const [preferredName, setPreferredName] = useState(profile?.preferred_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [airlineId, setAirlineId] = useState(profile?.airline_id ?? profile?.airline?.id ?? '');
  const [airport, setAirport] = useState(profile?.base_airport_iata ?? profile?.base_airport ?? '');
  const [crewRole, setCrewRole] = useState(profile?.crew_role ?? profile?.role_type ?? '');
  const [rank, setRank] = useState(profile?.rank ?? '');
  const [isVerified, setIsVerified] = useState(profile?.is_verified ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const airportOptions =
    airport && !airports.some((item) => item.iata === airport)
      ? [{ iata: airport, name: airport, city: null, is_active: true }, ...airports]
      : airports;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const parsed = customerProfileSchema.parse({
        full_name: fullName,
        full_name_native: fullNameNative,
        preferred_name: preferredName,
        username,
        airline_id: airlineId,
        base_airport_iata: airport,
        crew_role: crewRole,
        rank,
        is_verified: isVerified,
      });
      await updateCustomerProfileAction(user.id, parsed);
      toast.success('Customer details updated');
      router.push(`/users/${user.id}`);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof z.ZodError
          ? (err.issues[0]?.message ?? 'Check the form and try again')
          : err instanceof Error
            ? err.message
            : 'Failed to update customer';
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Override customer details</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <p className="text-sm text-zinc-500">
            Email stays {user.email}. The name shown in the app is the preferred name, or the full name when
            preferred is empty.
          </p>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferred_name">Preferred name</Label>
            <Input
              id="preferred_name"
              value={preferredName}
              onChange={(event) => setPreferredName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name_native">Name in native script</Label>
            <Input
              id="full_name_native"
              value={fullNameNative}
              onChange={(event) => setFullNameNative(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value.toLowerCase())}
              placeholder="optional"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="airline">Airline</Label>
              <select
                id="airline"
                value={airlineId}
                onChange={(event) => setAirlineId(event.target.value)}
                className={selectClassName}
              >
                <option value="">No airline</option>
                {airlines.map((airline) => (
                  <option key={airline.id} value={airline.id}>
                    {airline.is_active ? `${airline.code} · ${airline.name}` : `${airline.code} · ${airline.name} (inactive)`}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="airport">Base airport</Label>
              <select
                id="airport"
                value={airport}
                onChange={(event) => setAirport(event.target.value)}
                className={cn(selectClassName)}
              >
                <option value="">No base</option>
                {airportOptions.map((item) => (
                  <option key={item.iata} value={item.iata}>
                    {item.is_active ? `${item.iata} · ${item.name}` : `${item.iata} · ${item.name} (inactive)`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="crew_role">Crew role</Label>
              <select
                id="crew_role"
                value={crewRole}
                onChange={(event) => setCrewRole(event.target.value)}
                className={selectClassName}
              >
                <option value="">Not set</option>
                {CREW_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {CREW_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rank">Rank</Label>
              <Input id="rank" value={rank} onChange={(event) => setRank(event.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isVerified} onCheckedChange={setIsVerified} id="verified" />
            <Label htmlFor="verified">Verified</Label>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save overrides'}
            </Button>
            <Link href={`/users/${user.id}`}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
