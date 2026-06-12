import pino from 'pino';
import { env, isProduction, isTest } from './env.js';

export const logger = pino({
  level: isTest ? 'silent' : isProduction ? 'info' : 'debug',
  // Pretty-print in development; structured JSON in production.
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname'
        }
      },
  // Redact sensitive fields
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password'],
    censor: '[REDACTED]'
  }
});
