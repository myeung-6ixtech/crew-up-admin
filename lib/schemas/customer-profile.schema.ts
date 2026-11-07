import { z } from 'zod';

export const CREW_ROLES = ['cabin_crew', 'pilot', 'ground_ops', 'other'] as const;
export type CrewRole = (typeof CREW_ROLES)[number];

export const CREW_ROLE_LABELS: Record<CrewRole, string> = {
  cabin_crew: 'Cabin crew',
  pilot: 'Pilot',
  ground_ops: 'Ground ops',
  other: 'Other',
};

const usernamePattern = /^[a-z][a-z0-9._]{2,19}$/;

export const customerProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .max(100)
    .refine((value) => value.length === 0 || value.length >= 2, 'Full name must be 2–100 characters'),
  full_name_native: z.string().trim().max(100),
  preferred_name: z.string().trim().max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (value) => value === '' || (usernamePattern.test(value) && !/[._]{2}/.test(value)),
      'Username must be 3–20 characters, start with a letter, and use only letters, numbers, dots, and underscores',
    ),
  airline_id: z.union([z.string().uuid(), z.literal('')]),
  base_airport_iata: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => value === '' || /^[A-Z]{3}$/.test(value), 'Base airport must be a 3-letter code'),
  crew_role: z.union([z.literal(''), z.enum(CREW_ROLES)]),
  rank: z.string().trim().max(40),
  is_verified: z.boolean(),
});

export type CustomerProfileInput = z.infer<typeof customerProfileSchema>;
