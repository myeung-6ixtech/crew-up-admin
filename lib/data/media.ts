import 'server-only';

import { graphqlAsAdmin } from '@/lib/data/graphql';
import type { MediaAsset } from '@/lib/types/media';

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

export async function getMediaAssets(search?: string): Promise<MediaAsset[]> {
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

  const data = await graphqlAsAdmin<{ media_assets: MediaAsset[] }>(
    `
      query ListMediaAssets($where: media_assets_bool_exp!) {
        media_assets(where: $where, order_by: { created_at: desc }) {
          ${MEDIA_ASSET_FIELDS}
        }
      }
    `,
    { where },
  );

  return data.media_assets;
}

export async function getMediaAssetByFileId(fileId: string): Promise<MediaAsset | null> {
  const data = await graphqlAsAdmin<{ media_assets: MediaAsset[] }>(
    `
      query MediaAssetByFileId($fileId: uuid!) {
        media_assets(where: { file_id: { _eq: $fileId }, deleted_at: { _is_null: true } }, limit: 1) {
          ${MEDIA_ASSET_FIELDS}
        }
      }
    `,
    { fileId },
  );
  return data.media_assets[0] ?? null;
}
