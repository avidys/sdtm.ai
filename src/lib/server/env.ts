import { env } from '$env/dynamic/private';
import { z } from 'zod';

const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  MICROSOFT_CLIENT_ID: z.string().min(1, 'MICROSOFT_CLIENT_ID is required'),
  MICROSOFT_CLIENT_SECRET: z.string().min(1, 'MICROSOFT_CLIENT_SECRET is required'),
  AMAZON_CLIENT_ID: z.string().min(1, 'AMAZON_CLIENT_ID is required'),
  AMAZON_CLIENT_SECRET: z.string().min(1, 'AMAZON_CLIENT_SECRET is required'),
  BASE_URL: z
    .string()
    .url('BASE_URL must be a valid https:// or http:// URL')
    .default('http://localhost:5173'),
  MAGIC_LINK_EXPIRY_MINUTES: z
    .string()
    .default('15')
    .transform((val) => {
      const parsed = Number.parseInt(val, 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error('MAGIC_LINK_EXPIRY_MINUTES must be a positive integer');
      }
      return parsed;
    }),
  SMTP_FROM_ADDRESS: z.string().optional()
});

const parsed = envSchema.safeParse(env);

if (!parsed.success) {
  const message = parsed.error.issues.map((issue) => issue.message).join('\n');
  throw new Error(`Invalid environment variables:\n${message}`);
}

export const appEnv = parsed.data;
