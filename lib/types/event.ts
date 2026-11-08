export type PlatformEvent = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  venue_name: string | null;
  venue_address: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  visibility_scope: string;
  tags: string[];
  languages: string[];
  host_type: 'user' | 'platform';
  is_published: boolean;
  published_at: string | null;
  featured_until: string | null;
  featured_image_file_id: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
  attendees_aggregate?: { aggregate: { count: number } | null };
  eventActivities?: Array<{
    activity_id: string;
    activity: { id: string; slug: string; name: string; icon: string | null };
  }>;
};

export type PlatformEventInput = {
  title: string;
  description?: string;
  city: string;
  venue_name?: string;
  venue_address?: string;
  starts_at: string;
  ends_at?: string;
  capacity?: number | null;
  languages: string[];
  activity_ids: string[];
  tags: string[];
  is_published: boolean;
  featured_until?: string | null;
  featured_image_file_id?: string | null;
};