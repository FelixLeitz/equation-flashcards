import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

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
  // Will become required when the auth layer lands.
  JWT_SECRET: z.string().min(32).optional(),
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
