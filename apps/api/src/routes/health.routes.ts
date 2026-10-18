import { Router, Request, Response } from 'express';
import type { HealthCheckResponse, ReadinessCheckResponse } from '@ridemitra/shared';
import { config } from '../config/index.js';

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
 * Readiness probe: checks if essential subsystems are ready to serve traffic.
 * In Phase 1, database is documented as not yet configured in runtime.
 */
healthRouter.get('/ready', (_req: Request, res: Response) => {
  const payload: ReadinessCheckResponse = {
    status: 'ready',
    service: config.serviceName,
    version: config.version,
    timestamp: new Date().toISOString(),
    checks: {
      system: 'ok',
      database: 'not_configured', // Database integration is scheduled for Phase 2
    },
  };

  res.status(200).json({
    success: true,
    data: payload,
  });
});
