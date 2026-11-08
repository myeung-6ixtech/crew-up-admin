import { getMediaAssets } from '@/lib/data/media';
import { MediaLibrary } from '@/components/admin/media-library';
import { parsePage } from '@/components/admin/list-pagination';

export const metadata = { title: 'Media library' };

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page, q } = await searchParams;
  const search = q?.trim() ?? '';
  const assets = await getMediaAssets(search || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Media library</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Upload images once here, then reuse them as featured images on platform events. Matching
          files are deduplicated by content hash.
        </p>
      </div>
      <MediaLibrary assets={assets} page={parsePage(page)} search={search} />
    </div>
  );
}
