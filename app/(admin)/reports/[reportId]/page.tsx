import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { getReport } from '@/lib/data/moderation';
import { moderateReportAction } from '../actions';
import { ageLabel, personLabel, REASON_LABELS, ROSTER_FEEDBACK_REASON, targetLabel } from '../format';

export const metadata = { title: 'Report' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm text-zinc-900">{children}</dd>
    </div>
  );
}

export default async function ReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const { report, priorResolved, totalAgainst } = await getReport(reportId);
  if (!report) notFound();

  const isOpen = report.status === 'open' || report.status === 'reviewing';
  const action = moderateReportAction.bind(null, report.id);
  const message = report.reported_message;
  const meet = report.reported_event;
  const offender = report.reported_user;
  const isRosterFeedback = report.reason === ROSTER_FEEDBACK_REASON;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reports" className="text-sm text-zinc-500 underline">
          ← Reports
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{REASON_LABELS[report.reason] ?? report.reason}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <Badge variant={isOpen ? 'warning' : 'default'}>{report.status}</Badge>
          <span>
            {targetLabel(report)} report · filed {ageLabel(report.created_at)} ago ({new Date(report.created_at).toLocaleString()})
          </span>
          {report.content_flagged ? <Badge variant="warning">Flagged words in notes</Badge> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>People</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <Field label="Reported person">
                {offender ? (
                  <Link href={`/users/${offender.id}`} className="underline">
                    {personLabel(offender)}
                  </Link>
                ) : (
                  '—'
                )}
              </Field>
              <Field label="Report history">
                {totalAgainst > 0 ? (
                  <span className="flex items-center gap-2">
                    {totalAgainst} report{totalAgainst === 1 ? '' : 's'} in total, {priorResolved} previously actioned
                    {priorResolved >= 2 ? <Badge variant="destructive">Repeat offender</Badge> : null}
                  </span>
                ) : (
                  'No other reports'
                )}
              </Field>
              <Field label="Reporter">{personLabel(report.reporter)}</Field>
              <Field label="Reporter's notes">
                {report.details ? <p className="whitespace-pre-wrap">{report.details}</p> : <span className="text-zinc-500">None</span>}
              </Field>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reported content</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              {message ? (
                <Field label={`Message · ${new Date(message.created_at).toLocaleString()}`}>
                  {message.removed_at ? (
                    <span className="italic text-zinc-500">Removed {new Date(message.removed_at).toLocaleString()}</span>
                  ) : (
                    <p className="whitespace-pre-wrap rounded-md bg-zinc-50 p-3">{message.body || (message.media_file_id ? '[photo]' : '—')}</p>
                  )}
                </Field>
              ) : report.reported_message_id ? (
                <Field label="Message">Message no longer available</Field>
              ) : null}
              {meet ? (
                <Field label="Meet">
                  <span className="font-medium">{meet.title}</span>
                  <span className="text-zinc-500">
                    {' '}
                    · {meet.city ?? '—'} · {new Date(meet.starts_at).toLocaleString()}
                    {meet.cancelled_at ? ' · cancelled' : ''}
                  </span>
                </Field>
              ) : null}
              {!message && !meet && !report.reported_message_id ? <p className="text-sm text-zinc-500">This report is about the person.</p> : null}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isOpen ? 'Take action' : 'Outcome'}</CardTitle>
          <CardDescription>
            {isOpen
              ? 'Every action except "Mark reviewing" closes the report. Disabling an account signs the person out everywhere and blocks sign-in.'
              : `${report.resolution_notes ?? 'No notes'}${report.resolved_at ? ` · ${new Date(report.resolved_at).toLocaleString()}` : ''}${
                  report.resolver ? ` · by ${personLabel(report.resolver)}` : ''
                }`}
          </CardDescription>
        </CardHeader>
        {isOpen ? (
          <CardContent>
            <form action={action} className="space-y-3">
              <Textarea name="note" placeholder="Internal note (optional)" />
              <div className="flex flex-wrap gap-2">
                {report.status === 'open' ? (
                  <Button type="submit" name="action" value="reviewing" variant="outline">
                    Mark reviewing
                  </Button>
                ) : null}
                <Button type="submit" name="action" value="dismiss" variant="secondary">
                  Dismiss
                </Button>
                <Button type="submit" name="action" value="resolve" variant="outline">
                  Resolve (warned or no further action)
                </Button>
                {message && !message.removed_at ? (
                  <Button type="submit" name="action" value="remove_message" variant="destructive">
                    Remove message
                  </Button>
                ) : null}
                {meet && !meet.cancelled_at ? (
                  <Button type="submit" name="action" value="cancel_meet" variant="destructive">
                    Cancel meet
                  </Button>
                ) : null}
                {offender && !offender.disabled && !isRosterFeedback ? (
                  <Button type="submit" name="action" value="disable_user" variant="destructive">
                    Disable account
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
