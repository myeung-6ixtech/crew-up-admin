import { Skeleton } from '@/components/ui/skeleton';

export default function AirlineEditLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 max-w-2xl" />
    </div>
  );
}
