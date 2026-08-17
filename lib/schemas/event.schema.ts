import { z } from 'zod';

export const platformEventSchema = z.object({
  title: z.string().trim().min(2, 'Title is required'),
  description: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required'),
  venue_name: z.string().trim().optional(),
  venue_address: z.string().trim().optional(),
  starts_at: z.string().min(1, 'Start time is required'),
  ends_at: z.string().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  languages: z.array(z.string().trim().min(2)).min(1, 'At least one language is required'),
  activity_ids: z.array(z.string().uuid()),
  tags: z.array(z.string().trim().min(1)),
  is_published: z.boolean(),
  featured_until: z.string().optional().nullable(),
});

export type PlatformEventInput = z.infer<typeof platformEventSchema>;

export function parseTags(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function parseLanguages(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}
