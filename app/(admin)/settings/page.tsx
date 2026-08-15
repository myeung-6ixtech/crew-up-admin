import { getMcpInvocations, isMcpEnabled } from '@/lib/mcp/log';
import { McpSettingsPanel } from '@/components/admin/mcp-settings-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Admin portal configuration.</p>
      </div>

      <McpSettingsPanel enabled={isMcpEnabled()} invocations={getMcpInvocations()} />

      <Card>
        <CardHeader>
          <CardTitle>Deployment</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600">
          Deploy with only NEXT_PUBLIC_NHOST_SUBDOMAIN and NEXT_PUBLIC_NHOST_REGION.
          NHOST_ADMIN_SECRET is intentionally never set on this app.
        </CardContent>
      </Card>
    </div>
  );
}
