import { z } from 'zod';
import {
  MAX_DECK_TITLE_LENGTH,
  MAX_DECK_DESCRIPTION_LENGTH
} from '../constants.js';

export const createDeckSchema = z.object({
  title: z.string().min(1).max(MAX_DECK_TITLE_LENGTH),
  description: z.string().max(MAX_DECK_DESCRIPTION_LENGTH).optional()
});

export const updateDeckSchema = createDeckSchema.partial();
