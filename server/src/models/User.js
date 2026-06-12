import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MAX_DISPLAY_NAME_LENGTH } from '@flashcards/shared';
import { env } from '../config/env.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_DISPLAY_NAME_LENGTH
    },
    // Stored hash only — never the plaintext password
    passwordHash: {
      type: String,
      required: true,
      select: false // excluded from queries by default
    }
  },
  {
    timestamps: true // createdAt / updatedAt
  }
);

/**
 * Virtual setter: assign `user.password = '...'` and it will be hashed
 * in the pre-save hook below. The plaintext is held transiently and never
 * persisted.
 */
userSchema.virtual('password').set(function setPassword(plaintext) {
  this._plaintextPassword = plaintext;
});

// Hash the password before validating, if a new plaintext was provided.
userSchema.pre('validate', async function hashPassword(next) {
  if (!this._plaintextPassword) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(env.BCRYPT_COST);
    this.passwordHash = await bcrypt.hash(this._plaintextPassword, salt);
    this._plaintextPassword = undefined;
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Compare a candidate plaintext password against the stored hash.
 * Requires the passwordHash to have been selected (it's `select: false`),
 * e.g. User.findOne({ email }).select('+passwordHash').
 */
userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidate, this.passwordHash);
};

/**
 * Strip sensitive / internal fields from any JSON serialization.
 * This is a defense-in-depth layer on top of `select: false`.
 */
function sanitizeOutput(doc, ret) {
  ret.id = ret._id?.toString();
  delete ret._id;
  delete ret.__v;
  delete ret.passwordHash;
  return ret;
}

userSchema.set('toJSON', {
  virtuals: false,
  transform: sanitizeOutput
});

userSchema.set('toObject', {
  virtuals: false,
  transform: sanitizeOutput
});

export const User = mongoose.model('User', userSchema);
