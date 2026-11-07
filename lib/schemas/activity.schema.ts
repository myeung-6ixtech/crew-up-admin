import { z } from 'zod';

export const ACTIVITY_KINDS = ['activity', 'interest'] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  activity: 'Activity',
  interest: 'Interest',
};

/** `parent_id` null makes the row a group. A group cannot be attached to an event or a profile. */
export const activitySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(64, 'Slug must be at most 64 characters')
    .regex(/^[a-z0-9_]+$/, 'Slug must be lowercase letters, numbers, and underscores'),
  name: z.string().trim().min(2, 'Name is required'),
  description: z.string().trim().optional(),
  parent_id: z.string().uuid('Choose a group').nullable(),
  kind: z.enum(ACTIVITY_KINDS),
  icon: z.string().trim().optional(),
  sort_order: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

export type ActivityInput = z.infer<typeof activitySchema>;
