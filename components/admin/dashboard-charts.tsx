'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardMetrics } from '@/lib/data/metrics';

const SignupsChart = dynamic(() => import('@/components/admin/signups-chart').then((mod) => mod.SignupsChart), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full" />,
});

const PresenceChart = dynamic(
  () => import('@/components/admin/presence-chart').then((mod) => mod.PresenceChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 w-full" />,
  },
);

export function DashboardCharts({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SignupsChart data={metrics.signupsByDay} />
      <PresenceChart data={metrics.presenceByCity} />
    </div>
  );
}
