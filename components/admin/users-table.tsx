'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { AdminUser } from '@/lib/data/users';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

export function UsersTable({
  users,
  total,
  search,
  basePath,
}: {
  users: AdminUser[];
  total: number;
  search: string;
  basePath: '/users' | '/admin-management';
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(search);
  const [, startTransition] = useTransition();

  function applySearch() {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set('q', query.trim());
    } else {
      params.delete('q');
    }
    startTransition(() => {
      const queryString = params.toString();
      router.replace(queryString ? `${basePath}?${queryString}` : basePath);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search by email or display name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') applySearch();
          }}
        />
        <Button type="button" onClick={applySearch}>
          Search
        </Button>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white">
        <Table>
          <THead>
            <TR>
              <TH>User</TH>
              <TH>Airline</TH>
              <TH>Status</TH>
              <TH>Roles</TH>
              <TH>Created</TH>
            </TR>
          </THead>
          <TBody>
            {users.length ? (
              users.map((user) => (
                <TR key={user.id}>
                  <TD>
                    <Link href={`${basePath}/${user.id}`} className="font-medium hover:underline">
                      {user.profile?.display_name || user.displayName || user.email}
                    </Link>
                    <div className="text-xs text-zinc-500">{user.email}</div>
                  </TD>
                  <TD>{user.profile?.airline?.code ?? '—'}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {user.disabled ? <Badge variant="destructive">Disabled</Badge> : null}
                      {user.profile?.is_verified ? (
                        <Badge variant="success">Verified</Badge>
                      ) : (
                        <Badge variant="warning">Unverified</Badge>
                      )}
                    </div>
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((entry) => (
                        <Badge key={entry.role}>{entry.role}</Badge>
                      ))}
                    </div>
                  </TD>
                  <TD>{formatDate(user.createdAt)}</TD>
                </TR>
              ))
            ) : (
              <TR>
                <TD colSpan={5} className="text-zinc-500">
                  No accounts match this list.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>
      <p className="text-sm text-zinc-500">{total} accounts</p>
    </div>
  );
}
