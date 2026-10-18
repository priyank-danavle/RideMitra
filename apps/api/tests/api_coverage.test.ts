import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { app } from '../src/app.js';
import { query } from '../src/db/index.js';

describe('Phase 5.2 API Coverage & Documentation Verification', () => {
  let driverId: string;
  let driverToken: string;
  let vehicleId: string;
  let rideId: string;

  beforeAll(async () => {
    // 1. Register Driver
    const dRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Coverage Driver',
        email: `coverage.driver.${Date.now()}@example.com`,
        password: 'Password123!',
      });
    driverId = dRes.body.data.user.id;
    driverToken = dRes.body.data.token;

    // 2. Register Vehicle (Capacity: 3)
    const vRes = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        type: 'CAR',
        make: 'Maruti',
        model: 'Ignis',
        year: 2022,
        color: 'Glistening Grey',
        registrationNumber: `GJ-01-CV-${Date.now().toString().slice(-4)}`,
        capacity: 3,
      });
    vehicleId = vRes.body.data.vehicle.id;

    // 3. Create Ride (2 seats)
    const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
    const rRes = await request(app)
      .post('/api/v1/rides')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        vehicleId,
        type: 'INTERCITY',
        origin: 'Ahmedabad',
        destination: 'Mehsana',
        departureTime: futureDate,
        availableSeats: 2,
        pricePerSeat: 150,
      });
    rideId = rRes.body.data.ride.id;
  });

  afterAll(async () => {
    if (driverId) {
      await query('DELETE FROM users WHERE id = ?;', [driverId]);
    }
  });

  describe('OpenAPI & Swagger Documentation Endpoints', () => {
    it('serves OpenAPI 3.0.3 specification JSON at GET /api/v1/docs/openapi.json', async () => {
      const res = await request(app).get('/api/v1/docs/openapi.json');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.info.title).toBe('RideMitra REST API');
      expect(res.body.paths).toHaveProperty('/rides');
      expect(res.body.paths).toHaveProperty('/bookings');
      expect(res.body.paths).toHaveProperty('/auth/login');
      expect(res.body.paths).toHaveProperty('/vehicles');
    });

    it('serves interactive Swagger UI HTML at GET /api/v1/docs', async () => {
      const res = await request(app).get('/api/v1/docs');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('RideMitra API Documentation');
      expect(res.text).toContain('swagger-ui');
    });

    it('includes docs links in root GET / service summary', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body.endpoints).toHaveProperty('docs', '/api/v1/docs');
      expect(res.body.endpoints).toHaveProperty('openapi', '/api/v1/docs/openapi.json');
    });
  });

  describe('Uncovered Ride Modification Branches (PATCH /api/v1/rides/:id)', () => {
    it('rejects updating availableSeats beyond the registered vehicle capacity (400 EXCEEDS_CAPACITY)', async () => {
      // Vehicle capacity is 3, attempt to update available seats to 5
      const res = await request(app)
        .patch(`/api/v1/rides/${rideId}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ availableSeats: 5 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('EXCEEDS_CAPACITY');
      expect(res.body.error.message).toMatch(/cannot exceed vehicle capacity/i);
    });

    it('rejects updating a ride that is not in SCHEDULED status (400 INVALID_STATUS)', async () => {
      // Create a temporary ride and cancel it
      const futureDate = new Date(Date.now() + 86400000 * 6).toISOString();
      const rRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          vehicleId,
          type: 'CITY',
          origin: 'Satellite',
          destination: 'Bopal',
          departureTime: futureDate,
          availableSeats: 2,
          pricePerSeat: 50,
        });
      const tempRideId = rRes.body.data.ride.id;

      await request(app)
        .post(`/api/v1/rides/${tempRideId}/cancel`)
        .set('Authorization', `Bearer ${driverToken}`);

      // Attempt to modify the cancelled ride
      const patchRes = await request(app)
        .patch(`/api/v1/rides/${tempRideId}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ pickupPoint: 'New Pickup' });

      expect(patchRes.status).toBe(400);
      expect(patchRes.body.error.code).toBe('INVALID_STATUS');
    });

    it('returns 404 NOT_FOUND when updating a non-existent ride', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .patch(`/api/v1/rides/${nonExistentId}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ pickupPoint: 'Somewhere' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Uncovered Vehicle Branches (PATCH & GET /api/v1/vehicles/:id)', () => {
    it('returns 404 when updating a non-existent vehicle ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .patch(`/api/v1/vehicles/${nonExistentId}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ color: 'Jet Black' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('VEHICLE_NOT_FOUND');
    });

    it('returns 404 when deactivating an already deactivated or non-existent vehicle', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .delete(`/api/v1/vehicles/${nonExistentId}`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('VEHICLE_NOT_FOUND');
    });
  });

  describe('Uncovered User Profile Validation (PATCH /api/v1/users/profile)', () => {
    it('rejects invalid Indian mobile phone format (400 VALIDATION_ERROR)', async () => {
      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ phone: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/invalid mobile phone/i);
    });

    it('rejects attempt to modify privileged fields like role or id (mass assignment protection)', async () => {
      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/cannot modify privileged fields/i);
    });
  });

  describe('Uncovered Booking Detail 404 (GET /api/v1/bookings/:id)', () => {
    it('returns 404 NOT_FOUND for non-existent booking ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/v1/bookings/${nonExistentId}`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Unauthenticated Rejection Across Protected Routes', () => {
    it('rejects GET /api/v1/vehicles without authentication (401)', async () => {
      const res = await request(app).get('/api/v1/vehicles');
      expect(res.status).toBe(401);
    });

    it('rejects POST /api/v1/vehicles without authentication (401)', async () => {
      const res = await request(app).post('/api/v1/vehicles').send({ type: 'CAR' });
      expect(res.status).toBe(401);
    });

    it('rejects GET /api/v1/rides/driver/mine without authentication (401)', async () => {
      const res = await request(app).get('/api/v1/rides/driver/mine');
      expect(res.status).toBe(401);
    });

    it('rejects PATCH /api/v1/rides/:id without authentication (401)', async () => {
      const res = await request(app).patch(`/api/v1/rides/${rideId}`).send({ pricePerSeat: 200 });
      expect(res.status).toBe(401);
    });

    it('rejects GET /api/v1/bookings/passenger/mine without authentication (401)', async () => {
      const res = await request(app).get('/api/v1/bookings/passenger/mine');
      expect(res.status).toBe(401);
    });

    it('rejects GET /api/v1/bookings/driver/mine without authentication (401)', async () => {
      const res = await request(app).get('/api/v1/bookings/driver/mine');
      expect(res.status).toBe(401);
    });

    it('rejects GET /api/v1/users/profile without authentication (401)', async () => {
      const res = await request(app).get('/api/v1/users/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('Role-Based Access Control (requireRole middleware)', () => {
    it('enforces role restrictions when user role does not match required role', async () => {
      // In users table, driver has role USER.
      const [userRow] = await query<RowDataPacket[]>('SELECT role FROM users WHERE id = ?;', [
        driverId,
      ]);
      expect(userRow.role).toBe('USER');

      // Test requireRole directly via an ad-hoc request or checking auth.middleware
      const { requireRole } = await import('../src/middleware/auth.middleware.js');
      let statusCalled: number | null = null;
      let jsonCalled: { error?: { code?: string } } | null = null;
      let nextCalled = false;

      const mockReq = { user: { role: 'USER' } } as unknown as Request;
      const mockRes = {
        status: (s: number) => {
          statusCalled = s;
          return {
            json: (payload: { error?: { code?: string } }) => {
              jsonCalled = payload;
            },
          };
        },
      } as unknown as Response;
      const mockNext = () => {
        nextCalled = true;
      };

      const adminGuard = requireRole('ADMIN');
      adminGuard(mockReq, mockRes, mockNext);

      expect(statusCalled).toBe(403);
      expect(jsonCalled?.error?.code).toBe('FORBIDDEN');
      expect(nextCalled).toBe(false);
    });
  });
});
