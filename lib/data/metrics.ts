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
    totalEvents: number;
    totalRsvps: number;
    totalRosters: number;
    totalPresenceRows: number;
    totalMessages: number;
    totalConnections: number;
    acceptedConnections: number;
  };
  safety: {
    openReports: number;
    reviewingReports: number;
    totalBlocks: number;
    resolvedReports: number;
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
    eventsAggregate: events_aggregate { aggregate { count } }
    rsvpsAggregate: event_attendees_aggregate { aggregate { count } }
    rostersAggregate: rosters_aggregate { aggregate { count } }
    presenceAggregate: presence_aggregate { aggregate { count } }
    messagesAggregate: messages_aggregate { aggregate { count } }
    connectionsAggregate: connections_aggregate { aggregate { count } }
    acceptedConnectionsAggregate: connections_aggregate(
      where: { status: { _eq: accepted } }
    ) {
      aggregate { count }
    }
    openReportsAggregate: reports_aggregate(where: { status: { _eq: open } }) {
      aggregate { count }
    }
    reviewingReportsAggregate: reports_aggregate(where: { status: { _eq: reviewing } }) {
      aggregate { count }
    }
    resolvedReportsAggregate: reports_aggregate(where: { status: { _eq: resolved } }) {
      aggregate { count }
    }
    blocksAggregate: user_blocks_aggregate { aggregate { count } }
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
  eventsAggregate: { aggregate: { count: number } | null };
  rsvpsAggregate: { aggregate: { count: number } | null };
  rostersAggregate: { aggregate: { count: number } | null };
  presenceAggregate: { aggregate: { count: number } | null };
  messagesAggregate: { aggregate: { count: number } | null };
  connectionsAggregate: { aggregate: { count: number } | null };
  acceptedConnectionsAggregate: { aggregate: { count: number } | null };
  openReportsAggregate: { aggregate: { count: number } | null };
  reviewingReportsAggregate: { aggregate: { count: number } | null };
  resolvedReportsAggregate: { aggregate: { count: number } | null };
  blocksAggregate: { aggregate: { count: number } | null };
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
      totalEvents: count(data.eventsAggregate),
      totalRsvps: count(data.rsvpsAggregate),
      totalRosters: count(data.rostersAggregate),
      totalPresenceRows: count(data.presenceAggregate),
      totalMessages: count(data.messagesAggregate),
      totalConnections: count(data.connectionsAggregate),
      acceptedConnections: count(data.acceptedConnectionsAggregate),
    },
    safety: {
      openReports: count(data.openReportsAggregate),
      reviewingReports: count(data.reviewingReportsAggregate),
      totalBlocks: count(data.blocksAggregate),
      resolvedReports: count(data.resolvedReportsAggregate),
    },
    presenceByCity: [...cityCounts.entries()]
      .map(([city, countValue]) => ({ city, count: countValue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    signupsByDay: bucketSignupsByDay(data.recentUsers),
  };
}
