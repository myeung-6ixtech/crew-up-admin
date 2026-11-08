'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listMediaAssets } from '@/lib/api/media';
import type { MediaAsset } from '@/lib/types/media';
import { MediaThumbnail } from '@/components/admin/media-thumbnail';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function MediaPickerField({
  fileId,
  onChange,
  compact = false,
}: {
  fileId: string | null;
  onChange: (fileId: string | null) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(fileId);

  useEffect(() => {
    setSelected(fileId);
  }, [fileId]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const rows = await listMediaAssets(search);
          if (!cancelled) setAssets(rows);
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Failed to load media');
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [open, search]);

  function openPicker() {
    setSearch('');
    setSelected(fileId);
    setOpen(true);
  }

  function confirmSelection() {
    onChange(selected);
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      {fileId ? (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
          <MediaThumbnail
            fileId={fileId}
            className={compact ? 'aspect-[4/3] w-full' : 'aspect-video w-full max-w-md'}
          />
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-center text-sm text-zinc-500',
            compact ? 'aspect-[4/3] px-4' : 'min-h-28 px-6',
          )}
        >
          No image selected
        </div>
      )}

      <div className={cn('flex flex-wrap gap-2', compact ? 'flex-col' : '')}>
        <Button type="button" variant="outline" className={compact ? 'w-full' : undefined} onClick={openPicker}>
          {fileId ? 'Replace image' : 'Set featured image'}
        </Button>
        {fileId ? (
          <Button
            type="button"
            variant="ghost"
            className={compact ? 'w-full' : undefined}
            onClick={() => onChange(null)}
          >
            Remove image
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-zinc-500">
        Upload new files in the{' '}
        <Link href="/media" className="font-medium text-zinc-900 underline-offset-2 hover:underline">
          media library
        </Link>
        , then select them here.
      </p>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Choose featured image"
        description="Select an existing image from the media library."
        className="max-w-3xl"
      >
        <div className="space-y-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by filename or hash"
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault();
            }}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : assets.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No media found.{' '}
              <Link href="/media" className="font-medium text-zinc-900 underline-offset-2 hover:underline">
                Open the media library
              </Link>{' '}
              to upload.
            </p>
          ) : (
            <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
              {assets.map((asset) => {
                const active = selected === asset.file_id;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setSelected(asset.file_id)}
                    className={cn(
                      'overflow-hidden rounded-lg border text-left transition-colors',
                      active ? 'border-zinc-900 ring-2 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-400',
                    )}
                  >
                    <MediaThumbnail
                      fileId={asset.file_id}
                      alt={asset.original_filename ?? ''}
                      className="aspect-square w-full"
                    />
                    <div className="truncate px-2 py-1.5 text-xs text-zinc-700">
                      {asset.original_filename || 'Untitled'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!selected} onClick={confirmSelection}>
              Use selected
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
