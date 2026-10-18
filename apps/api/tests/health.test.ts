import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('API Foundation & Health Endpoints', () => {
  it('GET / should return service info and endpoint directory', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'ridemitra-api');
    expect(res.body).toHaveProperty('status', 'active');
    expect(res.body.endpoints).toHaveProperty('health');
    expect(res.body.endpoints).toHaveProperty('ready');
  });

  it('GET /api/v1/health should return healthy status 200 with JSON payload', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({
      success: true,
      data: expect.objectContaining({
        status: 'ok',
        service: 'ridemitra-api',
        version: expect.any(String),
        timestamp: expect.any(String),
        uptimeSeconds: expect.any(Number),
        environment: expect.any(String),
      }),
    });
  });

  it('GET /api/v1/ready should return system readiness checks', async () => {
    const res = await request(app).get('/api/v1/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: expect.objectContaining({
        status: 'ready',
        service: 'ridemitra-api',
        version: expect.any(String),
        timestamp: expect.any(String),
        checks: {
          system: 'ok',
          database: 'connected',
        },
      }),
    });
  });

  it('GET /api/v1/non-existent-route should return structured 404 response', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: expect.stringContaining('does not exist'),
      },
    });
  });

  it('Disallowed CORS origin should return HTTP 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://malicious-site.example.com');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: 'FORBIDDEN_CORS',
      }),
    });
  });

  it('Allowed CORS origin should include appropriate Access-Control-Allow-Origin header', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'http://localhost:5173');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
