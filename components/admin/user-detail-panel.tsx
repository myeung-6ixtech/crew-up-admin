'use client';

import { useTransition } from 'react';
import type { AdminUser } from '@/lib/data/users';
import {
  grantRoleAction,
  revokeRoleAction,
  toggleUserDisabledAction,
} from '@/app/(admin)/users/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

type UserDetail = AdminUser & {
  defaultRole: string | null;
  roles: Array<{ id: string; role: string; createdAt: string }>;
};

export function UserDetailPanel({
  user,
  currentUserId,
  canManageRoles,
}: {
  user: UserDetail;
  currentUserId: string;
  canManageRoles: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const isSelf = user.id === currentUserId;

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{user.profile?.display_name || user.displayName || user.email}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div><span className="font-medium">Email:</span> {user.email}</div>
          <div><span className="font-medium">User ID:</span> {user.id}</div>
          <div><span className="font-medium">Created:</span> {formatDate(user.createdAt)}</div>
          <div><span className="font-medium">Last seen:</span> {formatDate(user.lastSeen)}</div>
          <div><span className="font-medium">Default role:</span> {user.defaultRole ?? 'user'}</div>
          <div><span className="font-medium">Airline:</span> {user.profile?.airline?.name ?? '—'}</div>
          <div><span className="font-medium">Role type:</span> {user.profile?.role_type ?? '—'}</div>
          <div className="flex flex-wrap gap-2 pt-2">
            {user.disabled ? <Badge variant="destructive">Disabled</Badge> : null}
            {user.profile?.is_verified ? (
              <Badge variant="success">Verified</Badge>
            ) : (
              <Badge variant="warning">Unverified</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account access</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant={user.disabled ? 'default' : 'destructive'}
              disabled={pending || (isSelf && !user.disabled)}
              onClick={() =>
                run(() => toggleUserDisabledAction(user.id, !user.disabled))
              }
            >
              {user.disabled ? 'Enable account' : 'Disable account'}
            </Button>
            {isSelf ? (
              <p className="mt-2 text-xs text-zinc-500">You cannot disable your own account.</p>
            ) : null}
          </CardContent>
        </Card>

        {canManageRoles ? (
          <Card>
            <CardHeader>
              <CardTitle>Staff roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {user.roles.length ? (
                  user.roles.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-2">
                      <div>
                        <Badge>{entry.role}</Badge>
                        <div className="text-xs text-zinc-500">{formatDate(entry.createdAt)}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending || (isSelf && entry.role === 'staff_admin')}
                        onClick={() =>
                          run(() => revokeRoleAction(entry.id, user.id, entry.role))
                        }
                      >
                        Revoke
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No elevated roles assigned.</p>
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
                    Grant staff_admin
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
