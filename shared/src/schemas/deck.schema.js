import { z } from 'zod';
import {
  MAX_DECK_TITLE_LENGTH,
  MAX_DECK_DESCRIPTION_LENGTH
} from '../constants.js';

export const createDeckSchema = z.object({
  title: z.string().min(1).max(MAX_DECK_TITLE_LENGTH),
  description: z.string().max(MAX_DECK_DESCRIPTION_LENGTH).optional()
});

// PATCH: all fields optional, but at least one must be present.
export const updateDeckSchema = createDeckSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (title or description) must be provided.'
  });
