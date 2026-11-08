'use client';

import { useEffect, useState } from 'react';
import { nhostBrowser } from '@/lib/nhost-client';
import { cn } from '@/lib/utils';

export function MediaThumbnail({
  fileId,
  alt = '',
  className,
}: {
  fileId: string;
  alt?: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setFailed(false);

    void (async () => {
      try {
        const response = await nhostBrowser.storage.getFilePresignedURL(fileId);
        if (!cancelled && response.status === 200 && response.body?.url) {
          setSrc(response.body.url);
          return;
        }
      } catch {
        // Fall through to the placeholder.
      }
      if (!cancelled) setFailed(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-zinc-100 text-xs text-zinc-400',
          className,
        )}
      >
        No preview
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('object-cover', className)}
      onError={() => setFailed(true)}
    />
  );
}
