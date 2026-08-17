import { z } from 'zod';

export const ACTIVITY_CATEGORIES = [
  'food_drink',
  'outdoors',
  'nightlife',
  'wellness',
  'culture',
  'general',
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const activitySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(64, 'Slug must be at most 64 characters')
    .regex(/^[a-z0-9_]+$/, 'Slug must be lowercase letters, numbers, and underscores'),
  name: z.string().trim().min(2, 'Name is required'),
  description: z.string().trim().optional(),
  category: z.enum(ACTIVITY_CATEGORIES),
  icon: z.string().trim().optional(),
  sort_order: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

export type ActivityInput = z.infer<typeof activitySchema>;

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  food_drink: 'Food & drink',
  outdoors: 'Outdoors',
  nightlife: 'Nightlife',
  wellness: 'Wellness',
  culture: 'Culture',
  general: 'General',
};
