'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Airline } from '@/lib/types/airline';
import { createAirlineViaApi, updateAirlineViaApi } from '@/lib/api/airlines';
import { airlineSchema, parseEmailDomains } from '@/lib/schemas/airline.schema';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AirlineEditForm({
  airline,
  mode,
}: {
  airline: Airline | null;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [code, setCode] = useState(airline?.code ?? '');
  const [name, setName] = useState(airline?.name ?? '');
  const [domains, setDomains] = useState(airline?.email_domains.join('\n') ?? '');
  const [isActive, setIsActive] = useState(airline?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const parsed = airlineSchema.parse({
        code,
        name,
        email_domains: parseEmailDomains(domains),
        is_active: isActive,
      });

      if (mode === 'create') {
        await createAirlineViaApi(parsed);
        toast.success('Airline created');
      } else if (airline) {
        await updateAirlineViaApi(airline.id, parsed);
        toast.success('Airline updated');
      }

      router.push('/taxonomy/airlines');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save airline';
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Add airline' : 'Edit airline'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="code">IATA code</Label>
            <Input
              id="code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domains">Email domains</Label>
            <Textarea
              id="domains"
              value={domains}
              onChange={(event) => setDomains(event.target.value)}
              placeholder="singaporeair.com.sg"
              required
            />
            <p className="text-xs text-zinc-500">One domain per line, or comma-separated.</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} id="active" />
            <Label htmlFor="active">Active</Label>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : mode === 'create' ? 'Create airline' : 'Save changes'}
            </Button>
            <Link href="/taxonomy/airlines">
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
