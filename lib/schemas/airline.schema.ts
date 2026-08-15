import { z } from 'zod';

export const airlineSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(8, 'Code must be at most 8 characters'),
  name: z.string().trim().min(2, 'Name is required'),
  email_domains: z
    .array(z.string().trim().min(3))
    .min(1, 'At least one email domain is required'),
  is_active: z.boolean(),
});

export type AirlineInput = z.infer<typeof airlineSchema>;

export function parseEmailDomains(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}
