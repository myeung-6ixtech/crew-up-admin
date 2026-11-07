import Link from 'next/link';
import { StatCard } from '@/components/admin/stat-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { getReports, REPORT_STATUSES, type ReportListItem, type ReportStatus } from '@/lib/data/moderation';
import { ageLabel, personLabel, REASON_LABELS, SLA_HOURS, targetLabel } from './format';

export const metadata = { title: 'Reports' };

function SlaBadge({ report }: { report: ReportListItem }) {
  if (report.status !== 'open' && report.status !== 'reviewing') return null;
  const hours = (Date.now() - new Date(report.created_at).getTime()) / 3_600_000;
  if (hours >= SLA_HOURS) return <Badge variant="destructive">Over 24h</Badge>;
  if (hours >= SLA_HOURS - 6) return <Badge variant="warning">Due soon</Badge>;
  return null;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const status: ReportStatus = REPORT_STATUSES.includes(params.status as ReportStatus) ? (params.status as ReportStatus) : 'open';
  const { reports, counts, blocks } = await getReports(status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The app promises a review within 24 hours. Open reports are listed oldest first. New reports are emailed to the
          moderation inbox when <code>STAFF_ALERT_EMAIL</code> is configured.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Open reports" value={counts.open} />
        <StatCard title="Reviewing reports" value={counts.reviewing} />
        <StatCard title="Resolved reports" value={counts.resolved} />
        <StatCard title="User blocks" value={blocks} />
      </section>

      <div className="flex flex-wrap gap-2">
        {REPORT_STATUSES.map((value) => (
          <Link
            key={value}
            href={`/reports?status=${value}`}
            className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
              value === status ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            {value} ({counts[value]})
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {reports.length === 0 ? (
            <p className="text-sm text-zinc-500">No {status} reports.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Reason</TH>
                  <TH>About</TH>
                  <TH>Reported person</TH>
                  <TH>Reporter</TH>
                  <TH>Age</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {reports.map((report) => (
                  <TR key={report.id}>
                    <TD>
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{REASON_LABELS[report.reason] ?? report.reason}</span>
                        {report.content_flagged ? <Badge variant="warning">Flagged words</Badge> : null}
                      </div>
                    </TD>
                    <TD>{targetLabel(report)}</TD>
                    <TD>{personLabel(report.reported_user)}</TD>
                    <TD>{personLabel(report.reporter)}</TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <span>{ageLabel(report.created_at)}</span>
                        <SlaBadge report={report} />
                      </div>
                    </TD>
                    <TD className="text-right">
                      <Link href={`/reports/${report.id}`} className="text-sm font-medium text-zinc-900 underline">
                        Review
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
