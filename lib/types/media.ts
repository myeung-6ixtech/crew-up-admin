export type MediaAsset = {
  id: string;
  file_id: string;
  sha256: string;
  content_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  original_filename: string | null;
  uploaded_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
