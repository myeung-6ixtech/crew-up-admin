import type { ReportListItem } from '@/lib/data/moderation';

export const SLA_HOURS = 24;

export const REASON_LABELS: Record<string, string> = {
  harassment: 'Harassment or bullying',
  inappropriate: 'Sexual or inappropriate content',
  spam: 'Spam or scam',
  fake_profile: 'Fake profile or impersonation',
  safety: 'Safety concern',
  underage: 'May be under 18',
  other: 'Other',
  blocked_from_profile: 'Blocked from profile',
  roster_parse_issue: 'Roster import problem',
};

export function personLabel(person: ReportListItem['reporter']): string {
  if (!person) return '—';
  const name = person.profile?.full_name || person.displayName || person.email || person.id.slice(0, 8);
  const handle = person.profile?.username ? ` @${person.profile.username}` : '';
  return `${name}${handle}${person.disabled ? ' (disabled)' : ''}`;
}

export const ROSTER_FEEDBACK_REASON = 'roster_parse_issue';

export function targetLabel(report: Pick<ReportListItem, 'reason' | 'reported_message_id' | 'reported_event_id'>): string {
  if (report.reason === ROSTER_FEEDBACK_REASON) return 'Roster import (own account)';
  if (report.reported_message_id) return 'Message';
  if (report.reported_event_id) return 'Meet';
  return 'Person';
}

export function ageLabel(createdAt: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
