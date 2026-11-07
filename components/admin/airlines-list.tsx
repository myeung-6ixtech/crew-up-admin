import Link from 'next/link';
import type { Airline } from '@/lib/types/airline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { ListPagination, paginate } from '@/components/admin/list-pagination';

export function AirlinesList({ airlines, page }: { airlines: Airline[]; page: number }) {
  const paged = paginate(airlines, page);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href="/taxonomy/airlines/edit/new">
          <Button>Add airline</Button>
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <Table>
          <THead>
            <TR>
              <TH>Code</TH>
              <TH>Name</TH>
              <TH>Domains</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {paged.items.length ? (
              paged.items.map((airline) => (
                <TR key={airline.id}>
                  <TD className="font-medium">{airline.code}</TD>
                  <TD>{airline.name}</TD>
                  <TD className="max-w-xs truncate">{airline.email_domains.join(', ')}</TD>
                  <TD>
                    {airline.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="warning">Inactive</Badge>
                    )}
                  </TD>
                  <TD className="text-right">
                    <Link href={`/taxonomy/airlines/edit/${airline.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </TD>
                </TR>
              ))
            ) : (
              <TR>
                <TD colSpan={5} className="text-zinc-500">
                  No airlines yet. Add the first carrier to enable airline-email verification domains.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>
      <ListPagination
        page={paged.page}
        pages={paged.pages}
        from={paged.from}
        to={paged.to}
        total={paged.total}
        path="/taxonomy/airlines"
      />
    </div>
  );
}
