import mongoose from 'mongoose';
import { MAX_CARD_FACE_LENGTH } from '@flashcards/shared';

const cardSchema = new mongoose.Schema(
  {
    deckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      required: true,
      index: true // fast retrieval of a deck's cards
    },
    front: {
      type: String,
      default: '',
      maxlength: MAX_CARD_FACE_LENGTH
    },
    back: {
      type: String,
      default: '',
      maxlength: MAX_CARD_FACE_LENGTH
    },
    // Stable creation order within a deck.
    order: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound index for ordered retrieval of a deck's cards.
cardSchema.index({ deckId: 1, order: 1 });

function sanitizeOutput(doc, ret) {
  ret.id = ret._id?.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

cardSchema.set('toJSON', { transform: sanitizeOutput });
cardSchema.set('toObject', { transform: sanitizeOutput });

export const Card = mongoose.model('Card', cardSchema);
