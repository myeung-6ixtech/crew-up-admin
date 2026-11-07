'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import type { AdminUser } from '@/lib/data/users';
import {
  grantRoleAction,
  revokeRoleAction,
  toggleUserDisabledAction,
} from '@/app/(admin)/users/actions';
import { nhostBrowser } from '@/lib/nhost-client';
import { CREW_ROLE_LABELS, type CrewRole } from '@/lib/schemas/customer-profile.schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

type UserDetail = AdminUser & {
  defaultRole: string | null;
  roles: Array<{ id: string; role: string; createdAt: string }>;
};

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : (parts[0]?.[1] ?? '');
  return `${first}${last}`.toUpperCase() || '?';
}

function crewLabel(role: string | null | undefined) {
  if (!role) return null;
  return CREW_ROLE_LABELS[role as CrewRole] ?? role.replaceAll('_', ' ');
}

function ProfilePhoto({ name, fileId }: { name: string; fileId?: string | null }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await nhostBrowser.storage.getFilePresignedURL(fileId);
        if (!cancelled && response.status === 200 && response.body?.url) {
          setSrc(response.body.url);
          return;
        }
      } catch {
        // The initials stay in place when the photo cannot be loaded.
      }
      if (!cancelled) setFailed(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  const showImage = Boolean(src) && !failed;

  return (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-4 ring-white">
      {showImage ? (
        <img src={src ?? ''} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-2xl font-semibold text-zinc-600">
          {initialsFrom(name)}
        </div>
      )}
    </div>
  );
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className={mono ? 'mt-1 break-all font-mono text-xs text-zinc-700' : 'mt-1 truncate text-sm text-zinc-900'}>
        {value}
      </dd>
    </div>
  );
}

export function UserDetailPanel({
  user,
  currentUserId,
  canManageRoles,
  editHref,
}: {
  user: UserDetail;
  currentUserId: string;
  canManageRoles: boolean;
  editHref?: string;
}) {
  const [pending, startTransition] = useTransition();
  const isSelf = user.id === currentUserId;
  const profile = user.profile;
  const name = profile?.preferred_name || profile?.full_name || profile?.display_name || user.displayName || user.email;
  const role = crewLabel(profile?.crew_role || profile?.role_type);
  const airline = profile?.airline ? `${profile.airline.code} · ${profile.airline.name}` : null;
  const base = profile?.base_airport_iata || profile?.base_airport || null;

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="h-20 bg-zinc-900" />
        <CardContent className="px-6 pb-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="-mt-12">
                <ProfilePhoto name={name} fileId={profile?.avatar_file_id} />
              </div>
              <div className="min-w-0 pt-3">
                <h2 className="truncate text-2xl font-semibold text-zinc-900">{name}</h2>
                <p className="mt-1 truncate text-sm text-zinc-500">
                  {profile?.username ? `@${profile.username} · ` : ''}
                  {user.email}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {user.disabled ? (
                    <Badge variant="destructive">Disabled</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                  {profile?.is_verified ? (
                    <Badge variant="success">Verified</Badge>
                  ) : (
                    <Badge variant="warning">Unverified</Badge>
                  )}
                  {role ? <Badge>{role}</Badge> : null}
                  {profile?.airline ? <Badge>{profile.airline.code}</Badge> : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:pt-3">
              {editHref ? (
                <Link href={editHref}>
                  <Button>Edit details</Button>
                </Link>
              ) : null}
              <Button
                variant={user.disabled ? 'default' : 'outline'}
                disabled={pending || (isSelf && !user.disabled)}
                onClick={() => run(() => toggleUserDisabledAction(user.id, !user.disabled))}
              >
                {user.disabled ? 'Enable account' : 'Disable account'}
              </Button>
            </div>
          </div>
          {isSelf ? <p className="mt-3 text-xs text-zinc-500">You cannot disable your own account.</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Fact label="Email" value={user.email} />
              <Fact label="Username" value={profile?.username ? `@${profile.username}` : '—'} />
              <Fact label="Full name" value={profile?.full_name || '—'} />
              <Fact label="Preferred name" value={profile?.preferred_name || '—'} />
              <Fact label="Native name" value={profile?.full_name_native || '—'} />
              <Fact label="Airline" value={airline ?? '—'} />
              <Fact label="Base" value={base ?? '—'} />
              <Fact label="Crew role" value={role ?? '—'} />
              <Fact label="Rank" value={profile?.rank || '—'} />
              <Fact label="Joined" value={formatDate(user.createdAt)} />
              <Fact label="Last seen" value={formatDate(user.lastSeen)} />
              <Fact label="User ID" value={user.id} mono />
            </dl>
          </CardContent>
        </Card>

        {canManageRoles ? (
          <Card>
            <CardHeader>
              <CardTitle>Dashboard access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-500">
                Granting moderator or staff admin moves this person to Admin management.
              </p>
              <div className="space-y-2">
                {user.roles.length ? (
                  user.roles.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2">
                      <div>
                        <Badge>{entry.role}</Badge>
                        <div className="mt-1 text-xs text-zinc-500">{formatDate(entry.createdAt)}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending || (isSelf && entry.role === 'staff_admin')}
                        onClick={() => run(() => revokeRoleAction(entry.id, user.id, entry.role))}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No dashboard roles.</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!user.roles.some((entry) => entry.role === 'moderator') ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => grantRoleAction(user.id, 'moderator'))}
                  >
                    Grant moderator
                  </Button>
                ) : null}
                {!user.roles.some((entry) => entry.role === 'staff_admin') ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => grantRoleAction(user.id, 'staff_admin'))}
                  >
                    Grant staff admin
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
