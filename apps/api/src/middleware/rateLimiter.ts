import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import type { Request, Response, NextFunction } from 'express';

export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Disable in test environment to avoid test flakiness
  if (config.isTest) {
    return next();
  }

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 25, // Limit each IP to 25 auth requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message:
          'Too many authentication attempts from this IP. Please try again after 15 minutes.',
      },
    },
  })(req, res, next);
};
