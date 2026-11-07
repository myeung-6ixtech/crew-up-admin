import { AddTermsDialog } from '@/components/admin/add-terms-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { getModerationTerms } from '@/lib/data/moderation';
import { deleteTermAction } from './actions';

export const metadata = { title: 'Blocked words' };

export default async function ModerationTermsPage() {
  const terms = await getModerationTerms();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold">Blocked words</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Messages, meet titles and descriptions, names and usernames containing a <strong>block</strong> term are rejected
            with &ldquo;That includes words we don&apos;t allow.&rdquo; Report details are never rejected; a match only flags the
            report in the queue. Whole words match for spaced languages; Japanese, Chinese, Korean and Thai match anywhere.
          </p>
        </div>
        <AddTermsDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{terms.length} terms</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Term</TH>
                <TH>Language</TH>
                <TH>Severity</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {terms.map((item) => (
                <TR key={item.term}>
                  <TD className="font-mono text-sm">{item.term}</TD>
                  <TD>{item.lang}</TD>
                  <TD>
                    <Badge variant={item.severity === 'block' ? 'destructive' : 'warning'}>{item.severity}</Badge>
                  </TD>
                  <TD className="text-right">
                    <form action={deleteTermAction.bind(null, item.term)}>
                      <Button type="submit" variant="ghost" size="sm">
                        Remove
                      </Button>
                    </form>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
