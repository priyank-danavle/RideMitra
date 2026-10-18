import express, { Express } from 'express';
import helmet from 'helmet';
import { config } from './config/index.js';
import { corsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.routes.js';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // 2. CORS handling
  app.use(corsMiddleware);

  // 3. Body Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. Request Logging
  app.use(requestLogger);

  // 5. Root status check
  app.get('/', (_req, res) => {
    res.json({
      name: config.serviceName,
      version: config.version,
      status: 'active',
      endpoints: {
        health: `${config.apiPrefix}/health`,
        ready: `${config.apiPrefix}/ready`,
      },
    });
  });

  // 6. Mount API v1 routers
  app.use(config.apiPrefix, healthRouter);

  // 7. 404 Not Found Handler
  app.use(notFoundHandler);

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
