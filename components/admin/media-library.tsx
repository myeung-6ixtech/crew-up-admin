'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import {
  MEDIA_ACCEPT,
  MEDIA_MAX_BYTES,
  softDeleteMediaAsset,
  uploadMediaAsset,
} from '@/lib/api/media';
import type { MediaAsset } from '@/lib/types/media';
import { formatDate } from '@/lib/utils';
import { MediaThumbnail } from '@/components/admin/media-thumbnail';
import { ListPagination, LIST_PAGE_SIZE, paginate } from '@/components/admin/list-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary({
  assets: initialAssets,
  page,
  search,
}: {
  assets: MediaAsset[];
  page: number;
  search: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState(initialAssets);
  const [query, setQuery] = useState(search);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setAssets(initialAssets);
  }, [initialAssets]);

  useEffect(() => {
    setQuery(search);
  }, [search]);

  const paged = useMemo(() => paginate(assets, page, LIST_PAGE_SIZE), [assets, page]);

  function applySearch(next: string) {
    const trimmed = next.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set('q', trimmed);
    const qs = params.toString();
    router.push(qs ? `/media?${qs}` : '/media');
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;

    setUploading(true);
    let added = 0;
    let deduped = 0;

    try {
      for (const file of files) {
        if (!(MEDIA_ACCEPT as readonly string[]).includes(file.type)) {
          toast.error(`${file.name}: only JPEG, PNG, WebP, and GIF are allowed`);
          continue;
        }
        if (file.size > MEDIA_MAX_BYTES) {
          toast.error(`${file.name}: must be 10MB or smaller`);
          continue;
        }

        const result = await uploadMediaAsset(file);
        if (result.deduped) {
          deduped += 1;
          setAssets((prev) => {
            if (prev.some((asset) => asset.id === result.asset.id)) return prev;
            return [result.asset, ...prev];
          });
        } else {
          added += 1;
          setAssets((prev) => [result.asset, ...prev]);
        }
      }

      if (added) toast.success(added === 1 ? 'Uploaded 1 image' : `Uploaded ${added} images`);
      if (deduped) {
        toast.message(
          deduped === 1
            ? '1 image was already in the library'
            : `${deduped} images were already in the library`,
        );
      }
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeAsset(asset: MediaAsset) {
    if (!window.confirm(`Remove “${asset.original_filename || asset.sha256.slice(0, 12)}” from the library?`)) {
      return;
    }

    void (async () => {
      try {
        await softDeleteMediaAsset(asset.id);
        setAssets((prev) => prev.filter((row) => row.id !== asset.id));
        toast.success('Removed from library');
        startTransition(() => router.refresh());
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to remove');
      }
    })();
  }

  return (
    <div className="space-y-6">
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget === event.target) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files?.length) void handleFiles(event.dataTransfer.files);
        }}
        className={`rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${
          dragging ? 'border-zinc-900 bg-zinc-100' : 'border-zinc-300 bg-white'
        }`}
      >
        <Upload className="mx-auto h-8 w-8 text-zinc-400" />
        <p className="mt-3 text-sm font-medium text-zinc-900">
          {uploading ? 'Uploading…' : 'Drop images here, or choose files'}
        </p>
        <p className="mt-1 text-xs text-zinc-500">JPEG, PNG, WebP, GIF · max 10MB each</p>
        <div className="mt-4">
          <input
            ref={inputRef}
            type="file"
            accept={MEDIA_ACCEPT.join(',')}
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files?.length) void handleFiles(event.target.files);
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading || pending}
            onClick={() => inputRef.current?.click()}
          >
            Choose files
          </Button>
        </div>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          applySearch(query);
        }}
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by filename or hash"
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
        {search ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQuery('');
              router.push('/media');
            }}
          >
            Clear
          </Button>
        ) : null}
      </form>

      {paged.items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-zinc-500">
            {search ? 'No media matches this search.' : 'No media yet. Upload the first image above.'}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paged.items.map((asset) => (
              <Card key={asset.id} className="overflow-hidden">
                <MediaThumbnail
                  fileId={asset.file_id}
                  alt={asset.original_filename ?? ''}
                  className="aspect-square w-full"
                />
                <CardContent className="space-y-2 p-4">
                  <div className="truncate text-sm font-medium text-zinc-900">
                    {asset.original_filename || 'Untitled'}
                  </div>
                  <div className="space-y-0.5 text-xs text-zinc-500">
                    <div>{formatBytes(asset.size_bytes)}</div>
                    <div>{formatDate(asset.created_at)}</div>
                    {asset.width && asset.height ? (
                      <div>
                        {asset.width}×{asset.height}
                      </div>
                    ) : null}
                    <div className="truncate font-mono">{asset.sha256.slice(0, 16)}…</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-0 text-red-600 hover:bg-transparent hover:text-red-700"
                    onClick={() => removeAsset(asset)}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <ListPagination
            page={paged.page}
            pages={paged.pages}
            from={paged.from}
            to={paged.to}
            total={paged.total}
            path={search ? `/media?q=${encodeURIComponent(search)}` : '/media'}
          />
        </>
      )}
    </div>
  );
}
