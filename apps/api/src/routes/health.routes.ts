import { Router, Request, Response } from 'express';
import type { HealthCheckResponse, ReadinessCheckResponse } from '@ridemitra/shared';
import { config } from '../config/index.js';
import { testDbConnection } from '../db/index.js';

export const healthRouter = Router();

/**
 * GET /api/v1/health
 * Liveness probe: returns status 200 if the Node.js API process is responsive.
 */
healthRouter.get('/health', (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - config.startTime) / 1000);

  const payload: HealthCheckResponse = {
    status: 'ok',
    service: config.serviceName,
    version: config.version,
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    environment: config.env,
  };

  res.status(200).json({
    success: true,
    data: payload,
  });
});

/**
 * GET /api/v1/ready
 * Readiness probe: checks if database and subsystems are ready to serve traffic.
 */
healthRouter.get('/ready', async (_req: Request, res: Response) => {
  const isDbReady = await testDbConnection();

  const payload: ReadinessCheckResponse = {
    status: isDbReady ? 'ready' : 'not_ready',
    service: config.serviceName,
    version: config.version,
    timestamp: new Date().toISOString(),
    checks: {
      system: 'ok',
      database: isDbReady ? 'connected' : 'unreachable',
    },
  };

  const statusCode = isDbReady ? 200 : 503;
  res.status(statusCode).json({
    success: isDbReady,
    data: payload,
  });
});
