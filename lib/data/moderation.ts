import 'server-only';

import { graphqlAsAdmin } from '@/lib/data/graphql';
import { env } from '@/lib/env';
import { ensureServerSession } from '@/lib/nhost-server';

export type ModerationTerm = { term: string; lang: string; severity: 'block' | 'flag'; created_at: string };

export async function getModerationTerms(): Promise<ModerationTerm[]> {
  const data = await graphqlAsAdmin<{ moderation_terms: ModerationTerm[] }>(`
    query ModerationTerms {
      moderation_terms(order_by: [{ lang: asc }, { term: asc }]) { term lang severity created_at }
    }
  `);
  return data.moderation_terms;
}

/** Terms are normalized by a database trigger (lowercase, accents and leetspeak removed). Duplicates are skipped. */
export async function addModerationTerms(terms: string[], lang: string, severity: 'block' | 'flag', actorId: string) {
  const objects = [...new Set(terms.map((term) => term.trim()).filter(Boolean))].map((term) => ({ term, lang, severity }));
  if (!objects.length) return 0;
  const data = await graphqlAsAdmin<{ insert_moderation_terms: { affected_rows: number } }>(
    `
      mutation AddModerationTerms($objects: [moderation_terms_insert_input!]!) {
        insert_moderation_terms(objects: $objects, on_conflict: { constraint: moderation_terms_pkey, update_columns: [] }) {
          affected_rows
        }
      }
    `,
    { objects },
  );
  console.info(JSON.stringify({ event: 'admin.moderation.terms_added', actorId, count: data.insert_moderation_terms.affected_rows, lang, severity }));
  return data.insert_moderation_terms.affected_rows;
}

export async function deleteModerationTerm(term: string, actorId: string) {
  await graphqlAsAdmin(
    `mutation DeleteModerationTerm($term: String!) { delete_moderation_terms_by_pk(term: $term) { term } }`,
    { term },
  );
  console.info(JSON.stringify({ event: 'admin.moderation.term_deleted', actorId, at: new Date().toISOString() }));
}

export const REPORT_STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ModerationAction = 'reviewing' | 'dismiss' | 'resolve' | 'remove_message' | 'cancel_meet' | 'disable_user';

type PersonRef = {
  id: string;
  email: string | null;
  displayName: string | null;
  disabled: boolean;
  profile: { full_name: string | null; username: string | null } | null;
} | null;

export type ReportListItem = {
  id: string;
  reason: string;
  status: ReportStatus;
  content_flagged: boolean;
  created_at: string;
  reported_user_id: string | null;
  reported_message_id: string | null;
  reported_event_id: string | null;
  reporter: PersonRef;
  reported_user: PersonRef;
};

export type ReportDetail = ReportListItem & {
  details: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  resolver: PersonRef;
  reported_message: {
    id: string;
    body: string | null;
    media_file_id: string | null;
    removed_at: string | null;
    created_at: string;
    sender_id: string | null;
  } | null;
  reported_event: {
    id: string;
    title: string;
    city: string | null;
    starts_at: string;
    cancelled_at: string | null;
    creator_id: string;
  } | null;
};

const PERSON_FIELDS = `id email displayName disabled profile { full_name username }`;
const REPORT_LIST_FIELDS = `
  id reason status content_flagged created_at reported_user_id reported_message_id reported_event_id
  reporter { ${PERSON_FIELDS} }
  reported_user { ${PERSON_FIELDS} }
`;

/** Open and reviewing reports come oldest-first so the 24-hour SLA is worked in order. */
export async function getReports(status: ReportStatus): Promise<{
  reports: ReportListItem[];
  counts: Record<ReportStatus, number>;
  blocks: number;
}> {
  const oldestFirst = status === 'open' || status === 'reviewing';
  const data = await graphqlAsAdmin<{
    reports: ReportListItem[];
    open: { aggregate: { count: number } };
    reviewing: { aggregate: { count: number } };
    resolved: { aggregate: { count: number } };
    dismissed: { aggregate: { count: number } };
    blocks: { aggregate: { count: number } };
  }>(
    `
      query ModerationReports($status: report_status!, $order: order_by!) {
        reports(where: { status: { _eq: $status } }, order_by: { created_at: $order }, limit: 200) { ${REPORT_LIST_FIELDS} }
        open: reports_aggregate(where: { status: { _eq: open } }) { aggregate { count } }
        reviewing: reports_aggregate(where: { status: { _eq: reviewing } }) { aggregate { count } }
        resolved: reports_aggregate(where: { status: { _eq: resolved } }) { aggregate { count } }
        dismissed: reports_aggregate(where: { status: { _eq: dismissed } }) { aggregate { count } }
        blocks: user_blocks_aggregate { aggregate { count } }
      }
    `,
    { status, order: oldestFirst ? 'asc' : 'desc' },
  );
  return {
    reports: data.reports,
    counts: {
      open: data.open.aggregate.count,
      reviewing: data.reviewing.aggregate.count,
      resolved: data.resolved.aggregate.count,
      dismissed: data.dismissed.aggregate.count,
    },
    blocks: data.blocks.aggregate.count,
  };
}

export async function getReport(id: string): Promise<{ report: ReportDetail | null; priorResolved: number; totalAgainst: number }> {
  const data = await graphqlAsAdmin<{ reports_by_pk: Omit<ReportDetail, 'reported_message'> | null }>(
    `
      query ModerationReport($id: uuid!) {
        reports_by_pk(id: $id) {
          ${REPORT_LIST_FIELDS}
          details resolution_notes resolved_at
          resolver { ${PERSON_FIELDS} }
          reported_event { id title city starts_at cancelled_at creator_id }
        }
      }
    `,
    { id },
  );
  const report: ReportDetail | null = data.reports_by_pk
    ? {
        ...data.reports_by_pk,
        reported_message: data.reports_by_pk.reported_message_id
          ? (await callModerationFunction<{ message: ReportDetail['reported_message'] }>(`message?reportId=${encodeURIComponent(id)}`)).message
          : null,
      }
    : null;
  const offenderId = report?.reported_user_id ?? report?.reported_message?.sender_id ?? report?.reported_event?.creator_id ?? null;
  if (!report || !offenderId) return { report, priorResolved: 0, totalAgainst: 0 };

  const history = await graphqlAsAdmin<{
    resolved: { aggregate: { count: number } };
    total: { aggregate: { count: number } };
  }>(
    `
      query OffenderHistory($userId: uuid!, $id: uuid!) {
        resolved: reports_aggregate(
          where: { reported_user_id: { _eq: $userId }, status: { _eq: resolved }, id: { _neq: $id }, reason: { _neq: "roster_parse_issue" } }
        ) {
          aggregate { count }
        }
        total: reports_aggregate(where: { reported_user_id: { _eq: $userId }, reason: { _neq: "roster_parse_issue" } }) { aggregate { count } }
      }
    `,
    { userId: offenderId, id },
  );
  return { report, priorResolved: history.resolved.aggregate.count, totalAgainst: history.total.aggregate.count };
}

function functionsBaseUrl() {
  if (env.NEXT_PUBLIC_NHOST_FUNCTIONS_URL) return env.NEXT_PUBLIC_NHOST_FUNCTIONS_URL.replace(/\/$/, '');
  return `https://${env.NEXT_PUBLIC_NHOST_SUBDOMAIN}.functions.${env.NEXT_PUBLIC_NHOST_REGION}.nhost.run/v1`;
}

async function callModerationFunction<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const { session } = await ensureServerSession();
  if (!session?.accessToken) throw new Error('Not authenticated');
  const response = await fetch(`${functionsBaseUrl()}/admin/moderation/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(payload?.error?.message ?? `Moderation request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

/** Message bodies, user-hosted meets and auth sessions are outside staff_admin's Hasura permissions, so these run in functions. */
export function runModerationAction(reportId: string, action: ModerationAction, note: string) {
  return callModerationFunction<{ status: ReportStatus; outcome: string | null }>('action', { reportId, action, note });
}
