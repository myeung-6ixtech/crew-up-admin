import 'client-only';

import { getAdminRoleFromSession } from '@/lib/auth/session';
import { nhostGraphqlRequest } from '@/lib/api/nhost-graphql';
import { nhostBrowser } from '@/lib/nhost-client';
import type { MediaAsset } from '@/lib/types/media';

export const MEDIA_BUCKET = 'media';
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;
export const MEDIA_ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

const MEDIA_ASSET_FIELDS = `
  id
  file_id
  sha256
  content_type
  size_bytes
  width
  height
  original_filename
  uploaded_by_user_id
  created_at
  updated_at
  deleted_at
`;

export async function sha256Hex(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    image.src = url;
  });
}

export async function findMediaAssetBySha256(sha256: string): Promise<MediaAsset | null> {
  const data = await nhostGraphqlRequest<{ media_assets: MediaAsset[] }>(
    `
      query MediaAssetBySha($sha256: String!) {
        media_assets(
          where: { sha256: { _eq: $sha256 }, deleted_at: { _is_null: true } }
          limit: 1
        ) {
          ${MEDIA_ASSET_FIELDS}
        }
      }
    `,
    { sha256 },
  );
  return data.media_assets[0] ?? null;
}

export async function listMediaAssets(search?: string): Promise<MediaAsset[]> {
  const trimmed = search?.trim();
  const where = trimmed
    ? {
        deleted_at: { _is_null: true },
        _or: [
          { original_filename: { _ilike: `%${trimmed}%` } },
          { sha256: { _ilike: `%${trimmed}%` } },
        ],
      }
    : { deleted_at: { _is_null: true } };

  const data = await nhostGraphqlRequest<{ media_assets: MediaAsset[] }>(
    `
      query ListMediaAssetsClient($where: media_assets_bool_exp!) {
        media_assets(where: $where, order_by: { created_at: desc }) {
          ${MEDIA_ASSET_FIELDS}
        }
      }
    `,
    { where },
  );
  return data.media_assets;
}

export type UploadMediaResult = {
  asset: MediaAsset;
  deduped: boolean;
};

export async function uploadMediaAsset(file: File): Promise<UploadMediaResult> {
  if (!(MEDIA_ACCEPT as readonly string[]).includes(file.type)) {
    throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed.');
  }
  if (file.size > MEDIA_MAX_BYTES) {
    throw new Error('Image must be 10MB or smaller.');
  }

  const sha256 = await sha256Hex(file);
  const existing = await findMediaAssetBySha256(sha256);
  if (existing) {
    return { asset: existing, deduped: true };
  }

  const session = await nhostBrowser.refreshSession();
  const role = getAdminRoleFromSession(session);
  if (!role) {
    throw new Error('Not authenticated as staff');
  }

  const upload = await nhostBrowser.storage.uploadFiles(
    {
      'file[]': [file],
      'bucket-id': MEDIA_BUCKET,
    },
    {
      headers: {
        'x-hasura-role': role,
      },
    },
  );

  const uploaded = upload.body?.processedFiles?.[0];
  if (!uploaded?.id) {
    throw new Error('Upload failed');
  }

  const size = await readImageSize(file);
  const data = await nhostGraphqlRequest<{ insert_media_assets_one: MediaAsset | null }>(
    `
      mutation InsertMediaAsset($object: media_assets_insert_input!) {
        insert_media_assets_one(object: $object) {
          ${MEDIA_ASSET_FIELDS}
        }
      }
    `,
    {
      object: {
        file_id: uploaded.id,
        sha256,
        content_type: file.type,
        size_bytes: file.size,
        width: size?.width ?? null,
        height: size?.height ?? null,
        original_filename: file.name || null,
      },
    },
  );

  if (!data.insert_media_assets_one) {
    throw new Error('Failed to catalog uploaded media');
  }

  return { asset: data.insert_media_assets_one, deduped: false };
}

export async function softDeleteMediaAsset(id: string): Promise<void> {
  const data = await nhostGraphqlRequest<{
    update_media_assets_by_pk: { id: string } | null;
  }>(
    `
      mutation SoftDeleteMediaAsset($id: uuid!, $deletedAt: timestamptz!) {
        update_media_assets_by_pk(pk_columns: { id: $id }, _set: { deleted_at: $deletedAt }) {
          id
        }
      }
    `,
    { id, deletedAt: new Date().toISOString() },
  );

  if (!data.update_media_assets_by_pk) {
    throw new Error('Failed to remove media asset');
  }
}
