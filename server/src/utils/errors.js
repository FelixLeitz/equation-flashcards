export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Request failed validation.', details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required.') {
    super(message, 401, 'UNAUTHENTICATED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict.') {
    super(message, 409, 'CONFLICT');
  }
}
