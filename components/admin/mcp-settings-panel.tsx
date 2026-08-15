'use client';

import { useState, useTransition } from 'react';
import { setMcpEnabledAction } from '@/app/(admin)/settings/actions';
import type { McpInvocation } from '@/lib/mcp/log';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

export function McpSettingsPanel({
  enabled: initialEnabled,
  invocations,
}: {
  enabled: boolean;
  invocations: McpInvocation[];
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>MCP Access</CardTitle>
        <CardDescription>
          Session-scoped MCP tools that wrap the same lib/data functions as the UI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Endpoint status</div>
            <div className="text-sm text-zinc-500">POST /api/mcp</div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={enabled ? 'success' : 'warning'}>
              {enabled ? 'Active' : 'Disabled'}
            </Badge>
            <Switch
              checked={enabled}
              disabled={pending}
              onCheckedChange={(checked) => {
                setEnabled(checked);
                startTransition(async () => {
                  await setMcpEnabledAction(checked);
                });
              }}
            />
          </div>
        </div>

        <div>
          <div className="mb-3 font-medium">Recent tool calls</div>
          <div className="rounded-xl border border-zinc-200">
            <Table>
              <THead>
                <TR>
                  <TH>Tool</TH>
                  <TH>Admin</TH>
                  <TH>Time</TH>
                </TR>
              </THead>
              <TBody>
                {invocations.length ? (
                  invocations.map((entry, index) => (
                    <TR key={`${entry.timestamp}-${index}`}>
                      <TD>{entry.tool}</TD>
                      <TD>{entry.adminEmail}</TD>
                      <TD>{formatDate(entry.timestamp)}</TD>
                    </TR>
                  ))
                ) : (
                  <TR>
                    <TD colSpan={3} className="text-zinc-500">
                      No MCP invocations yet. Logs reset on deploy.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
