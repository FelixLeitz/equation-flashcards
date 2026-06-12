import mongoose from 'mongoose';
import {
  MAX_DECK_TITLE_LENGTH,
  MAX_DECK_DESCRIPTION_LENGTH
} from '@flashcards/shared';

const deckSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true //: fast listing of a user's decks
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_DECK_TITLE_LENGTH
    },
    description: {
      type: String,
      trim: true,
      maxlength: MAX_DECK_DESCRIPTION_LENGTH,
      default: ''
    }
  },
  {
    timestamps: true // createdAt / updatedAt
  }
);

// Clean JSON output: id instead of _id, drop __v.
function sanitizeOutput(doc, ret) {
  ret.id = ret._id?.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

deckSchema.set('toJSON', { transform: sanitizeOutput });
deckSchema.set('toObject', { transform: sanitizeOutput });

export const Deck = mongoose.model('Deck', deckSchema);
