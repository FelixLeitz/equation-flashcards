import { z } from 'zod';
import { MAX_CARD_FACE_LENGTH } from '../constants.js';

// A card face may be empty or contain text/LaTeX up to the max length.
export const createCardSchema = z.object({
  front: z.string().max(MAX_CARD_FACE_LENGTH).default(''),
  back: z.string().max(MAX_CARD_FACE_LENGTH).default('')
});

// PATCH: all fields optional, but at least one must be provided.
export const updateCardSchema = z
  .object({
    front: z.string().max(MAX_CARD_FACE_LENGTH),
    back: z.string().max(MAX_CARD_FACE_LENGTH)
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (front or back) must be provided.'
  });
