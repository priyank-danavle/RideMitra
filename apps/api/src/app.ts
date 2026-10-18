import express, { Express } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { corsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { vehicleRouter } from './routes/vehicle.routes.js';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // 2. CORS handling (allow cookies & credentials)
  app.use(corsMiddleware);

  // 3. Body & Cookie Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

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
        auth: `${config.apiPrefix}/auth`,
        users: `${config.apiPrefix}/users`,
        vehicles: `${config.apiPrefix}/vehicles`,
      },
    });
  });

  // 6. Mount API v1 routers
  app.use(config.apiPrefix, healthRouter);
  app.use(`${config.apiPrefix}/auth`, authRouter);
  app.use(`${config.apiPrefix}/users`, userRouter);
  app.use(`${config.apiPrefix}/vehicles`, vehicleRouter);

  // 7. 404 Not Found Handler
  app.use(notFoundHandler);

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
