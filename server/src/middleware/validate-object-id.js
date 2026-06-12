import mongoose from 'mongoose';
import { NotFoundError } from '../utils/errors.js';

/**
 * Validate that a route param is a well-formed Mongo ObjectId.
 * Returns 404 for malformed ids (consistent with not-found).
 */
export function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
      return next(new NotFoundError('Resource not found.'));
    }
    next();
  };
}
