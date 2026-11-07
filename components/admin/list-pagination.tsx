import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const LIST_PAGE_SIZE = 20;

export function parsePage(value: string | undefined): number {
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) return 1;
  return page;
}

export function paginate<T>(items: T[], requestedPage: number, pageSize = LIST_PAGE_SIZE) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, pages);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
  };
}

export function ListPagination({
  page,
  pages,
  from,
  to,
  total,
  path,
}: {
  page: number;
  pages: number;
  from: number;
  to: number;
  total: number;
  path: string;
}) {
  function href(nextPage: number) {
    return nextPage <= 1 ? path : `${path}?page=${nextPage}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
      <span>{total === 0 ? '0 rows' : `${from}–${to} of ${total}`}</span>
      <div className="flex items-center gap-2">
        <span>
          Page {page} of {pages}
        </span>
        {page > 1 ? (
          <Link href={href(page - 1)}>
            <Button type="button" variant="outline" size="sm">
              Previous
            </Button>
          </Link>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled>
            Previous
          </Button>
        )}
        {page < pages ? (
          <Link href={href(page + 1)}>
            <Button type="button" variant="outline" size="sm">
              Next
            </Button>
          </Link>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
