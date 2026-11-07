export type Activity = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** Slug of the group, or the row's own slug when it is a group. Kept by a database trigger. */
  category: string;
  parent_id: string | null;
  kind: 'activity' | 'interest';
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ActivityUsage = {
  event_count: number;
  preference_count: number;
};