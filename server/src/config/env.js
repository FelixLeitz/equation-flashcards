import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().optional(),
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
