import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ override: false });

const isTestEnv = process.env.NODE_ENV === 'test';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  // Required outside tests; tests supply an in-memory URI at runtime.
  MONGODB_URI: isTestEnv
    ? z.string().optional()
    : z.string().min(1, 'MONGODB_URI is required'),
  // Hashing cost for bcrypt (optional, defaults to 12)
  BCRYPT_COST: z.coerce.number().int().positive().optional().default(12),
  // Required outside tests; tests use a fixed test secret.
  JWT_SECRET: isTestEnv
    ? z.string().min(32).default('test-secret-at-least-32-characters-long!!')
    : z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  // Token lifetime (REQ-ACC-010: <= 7 days).
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  SENTRY_DSN: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Use console here because the logger may depends on env.
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
