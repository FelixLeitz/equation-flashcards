import { ValidationError } from '../utils/errors.js';

/**
 * Returns middleware that validates req.body against the given Zod schema.
 * On success, replaces req.body with the parsed (and coerced) data.
 * On failure, forwards a ValidationError (400) with structured details.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message
      }));
      return next(
        new ValidationError('Request body failed validation.', details)
      );
    }
    req.body = result.data;
    next();
  };
}
