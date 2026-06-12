import { z } from 'zod';
import { MAX_DISPLAY_NAME_LENGTH, MIN_PASSWORD_LENGTH } from '../constants.js';

export const signupSchema = z.object({
  email: z.string().email().toLowerCase(),
  displayName: z.string().min(1).max(MAX_DISPLAY_NAME_LENGTH),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH)
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1)
});