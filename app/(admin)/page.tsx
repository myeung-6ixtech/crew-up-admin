import { getDashboardMetrics } from '@/lib/data/metrics';
import { StatCard } from '@/components/admin/stat-card';
import { DashboardCharts } from '@/components/admin/dashboard-charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Usage dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Live aggregates over transactional tables. DAU is approximated from auth.users.lastSeen,
          not an event stream.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total users" value={metrics.growth.totalUsers} />
        <StatCard title="Verified users" value={metrics.growth.verifiedUsers} />
        <StatCard
          title="Seen in last 7 days"
          value={metrics.growth.usersSeenLast7Days}
          hint="Approximate active users"
        />
        <StatCard title="Pending verifications" value={metrics.growth.pendingVerifications} />
      </section>

      <DashboardCharts metrics={metrics} />

      <Card>
        <CardHeader>
          <CardTitle>Operational notes</CardTitle>
          <CardDescription>
            Verification queue, moderation queue, and content explorer are deferred to a later phase.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600">
          Backend permissions for verifications and reports already exist, so those modules can be
          added to this shell without rework.
        </CardContent>
      </Card>
    </div>
  );
}
