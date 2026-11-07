import 'server-only';

import { graphqlAsAdmin } from '@/lib/data/graphql';

export type DashboardMetrics = {
  growth: {
    totalUsers: number;
    verifiedUsers: number;
    pendingVerifications: number;
    usersSeenLast7Days: number;
  };
  engagement: {
    totalRosters: number;
    totalPresenceRows: number;
  };
  presenceByCity: Array<{ city: string; count: number }>;
  signupsByDay: Array<{ date: string; count: number }>;
};

const METRICS_QUERY = `
  query DashboardMetrics($since: timestamptz!) {
    usersAggregate: usersAggregate {
      aggregate { count }
    }
    usersSeenAggregate: usersAggregate(where: { lastSeen: { _gte: $since } }) {
      aggregate { count }
    }
    verifiedAggregate: profiles_aggregate(where: { is_verified: { _eq: true } }) {
      aggregate { count }
    }
    pendingVerificationsAggregate: verifications_aggregate(
      where: { status: { _eq: pending } }
    ) {
      aggregate { count }
    }
    rostersAggregate: rosters_aggregate { aggregate { count } }
    presenceAggregate: presence_aggregate { aggregate { count } }
    presenceByCity: presence(
      order_by: { city: asc }
      distinct_on: city
      limit: 10
    ) {
      city
    }
    recentUsers: users(
      where: { createdAt: { _gte: $since } }
      order_by: { createdAt: asc }
    ) {
      createdAt
    }
  }
`;

type MetricsResponse = {
  usersAggregate: { aggregate: { count: number } | null };
  usersSeenAggregate: { aggregate: { count: number } | null };
  verifiedAggregate: { aggregate: { count: number } | null };
  pendingVerificationsAggregate: { aggregate: { count: number } | null };
  rostersAggregate: { aggregate: { count: number } | null };
  presenceAggregate: { aggregate: { count: number } | null };
  presenceByCity: Array<{ city: string }>;
  recentUsers: Array<{ createdAt: string }>;
};

function count(value: { aggregate: { count: number } | null } | undefined): number {
  return value?.aggregate?.count ?? 0;
}

function bucketSignupsByDay(users: Array<{ createdAt: string }>): Array<{ date: string; count: number }> {
  const buckets = new Map<string, number>();
  for (const user of users) {
    const date = user.createdAt.slice(0, 10);
    buckets.set(date, (buckets.get(date) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, countValue]) => ({ date, count: countValue }));
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const data = await graphqlAsAdmin<MetricsResponse>(METRICS_QUERY, { since });

  const cityCounts = data.presenceByCity.reduce<Map<string, number>>((acc, row) => {
    acc.set(row.city, (acc.get(row.city) ?? 0) + 1);
    return acc;
  }, new Map());

  return {
    growth: {
      totalUsers: count(data.usersAggregate),
      verifiedUsers: count(data.verifiedAggregate),
      pendingVerifications: count(data.pendingVerificationsAggregate),
      usersSeenLast7Days: count(data.usersSeenAggregate),
    },
    engagement: {
      totalRosters: count(data.rostersAggregate),
      totalPresenceRows: count(data.presenceAggregate),
    },
    presenceByCity: [...cityCounts.entries()]
      .map(([city, countValue]) => ({ city, count: countValue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    signupsByDay: bucketSignupsByDay(data.recentUsers),
  };
}
