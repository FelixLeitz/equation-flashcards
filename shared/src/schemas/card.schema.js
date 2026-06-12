import { z } from 'zod';
import { MAX_CARD_FACE_LENGTH } from '../constants.js';

export const createCardSchema = z.object({
  front: z.string().max(MAX_CARD_FACE_LENGTH),
  back: z.string().max(MAX_CARD_FACE_LENGTH)
});

export const updateCardSchema = createCardSchema.partial();