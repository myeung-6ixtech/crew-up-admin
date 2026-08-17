import Link from 'next/link';
import type { PlatformEvent } from '@/lib/types/event';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

export function EventsList({ events }: { events: PlatformEvent[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href="/events/create">
          <Button>Create event</Button>
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <Table>
          <THead>
            <TR>
              <TH>Title</TH>
              <TH>City</TH>
              <TH>Starts</TH>
              <TH>RSVPs</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {events.length ? (
              events.map((event) => (
                <TR key={event.id}>
                  <TD className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{event.title}</span>
                      {event.featured_until ? <Badge>Featured</Badge> : null}
                    </div>
                  </TD>
                  <TD>{event.city}</TD>
                  <TD>{formatDateTime(event.starts_at)}</TD>
                  <TD>{event.attendees_aggregate?.aggregate?.count ?? 0}</TD>
                  <TD>
                    {event.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                  </TD>
                  <TD className="text-right">
                    <Link href={`/events/edit/${event.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </TD>
                </TR>
              ))
            ) : (
              <TR>
                <TD colSpan={6} className="text-zinc-500">
                  No upcoming platform events yet. Create the first CrewUp-hosted meetup.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
