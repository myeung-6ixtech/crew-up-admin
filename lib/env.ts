import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_NHOST_SUBDOMAIN: z.string().min(1),
  NEXT_PUBLIC_NHOST_REGION: z.string().min(1),
  NEXT_PUBLIC_NHOST_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_NHOST_GRAPHQL_URL: z.string().url().optional(),
  NEXT_PUBLIC_NHOST_STORAGE_URL: z.string().url().optional(),
  NEXT_PUBLIC_NHOST_FUNCTIONS_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_NHOST_SUBDOMAIN: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN,
  NEXT_PUBLIC_NHOST_REGION: process.env.NEXT_PUBLIC_NHOST_REGION,
  NEXT_PUBLIC_NHOST_AUTH_URL: process.env.NEXT_PUBLIC_NHOST_AUTH_URL,
  NEXT_PUBLIC_NHOST_GRAPHQL_URL: process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
  NEXT_PUBLIC_NHOST_STORAGE_URL: process.env.NEXT_PUBLIC_NHOST_STORAGE_URL,
  NEXT_PUBLIC_NHOST_FUNCTIONS_URL: process.env.NEXT_PUBLIC_NHOST_FUNCTIONS_URL,
  NODE_ENV: process.env.NODE_ENV,
});
