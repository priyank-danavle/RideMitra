import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (config.isTest) {
    return next();
  }

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    const logColor =
      statusCode >= 500
        ? '\x1b[31m' // Red
        : statusCode >= 400
          ? '\x1b[33m' // Yellow
          : '\x1b[32m'; // Green
    const reset = '\x1b[0m';

    console.log(
      `[${new Date().toISOString()}] ${method} ${originalUrl} ${logColor}${statusCode}${reset} - ${duration}ms`,
    );
  });

  next();
}
