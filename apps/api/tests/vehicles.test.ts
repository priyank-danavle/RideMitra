import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { query } from '../src/db/index.js';
import type { RowDataPacket } from 'mysql2';
import type { Vehicle } from '@ridemitra/shared';

describe('Phase 2 Vehicle Management API', () => {
  let userAId: string;
  let userAToken: string;

  let userBId: string;
  let userBToken: string;

  let userAVehicleId: string;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Driver Alpha',
        email: `driver.alpha.${Date.now()}@example.com`,
        password: 'StrongPassword123!',
      });
    userAId = resA.body.data.user.id;
    userAToken = resA.body.data.token;

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Driver Beta',
        email: `driver.beta.${Date.now()}@example.com`,
        password: 'StrongPassword123!',
      });
    userBId = resB.body.data.user.id;
    userBToken = resB.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    if (userAId) await query('DELETE FROM users WHERE id = ?;', [userAId]);
    if (userBId) await query('DELETE FROM users WHERE id = ?;', [userBId]);
  });

  it('POST /api/v1/vehicles requires authentication', async () => {
    const res = await request(app).post('/api/v1/vehicles').send({
      type: 'CAR',
      make: 'Maruti Suzuki',
      model: 'Swift',
      year: 2022,
      color: 'Pearl White',
      registrationNumber: 'GJ-05-AB-1234',
      capacity: 4,
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/v1/vehicles creates a car with valid parameters', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'CAR',
        make: 'Maruti Suzuki',
        model: 'Swift Dzire',
        year: 2022,
        color: 'Arctic Silver',
        registrationNumber: 'GJ-05-XY-9876',
        capacity: 4,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vehicle).toBeDefined();
    expect(res.body.data.vehicle.userId).toBe(userAId);
    expect(res.body.data.vehicle.type).toBe('CAR');
    expect(res.body.data.vehicle.make).toBe('Maruti Suzuki');
    expect(res.body.data.vehicle.registrationNumber).toBe('GJ-05-XY-9876');
    expect(res.body.data.vehicle.capacity).toBe(4);
    // Crucial requirement: default to unverified
    expect(res.body.data.vehicle.isVerified).toBe(false);
    expect(res.body.data.vehicle.isActive).toBe(true);

    userAVehicleId = res.body.data.vehicle.id;
  });

  it('POST /api/v1/vehicles enforces Bike capacity must be exactly 1', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'BIKE',
        make: 'Honda',
        model: 'Activa 6G',
        year: 2023,
        color: 'Matte Grey',
        registrationNumber: 'GJ-05-BK-5555',
        capacity: 3, // Invalid for bike!
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Bikepooling capacity must be exactly 1');
  });

  it('POST /api/v1/vehicles creates a bike with capacity 1', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'BIKE',
        make: 'Royal Enfield',
        model: 'Hunter 350',
        year: 2023,
        color: 'Dapper Ash',
        registrationNumber: 'GJ-05-RE-3500',
        capacity: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.vehicle.type).toBe('BIKE');
    expect(res.body.data.vehicle.capacity).toBe(1);
  });

  it('GET /api/v1/vehicles lists all active vehicles of the authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/vehicles')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.vehicles.length).toBe(2); // Car and Bike
    expect(res.body.data.vehicles.every((v: Vehicle) => v.userId === userAId)).toBe(true);
  });

  it('GET /api/v1/vehicles/:id retrieves single vehicle owned by the user', async () => {
    const res = await request(app)
      .get(`/api/v1/vehicles/${userAVehicleId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.vehicle.id).toBe(userAVehicleId);
    expect(res.body.data.vehicle.make).toBe('Maruti Suzuki');
  });

  it('Cross-User Ownership Isolation: User B cannot retrieve User A vehicle', async () => {
    const res = await request(app)
      .get(`/api/v1/vehicles/${userAVehicleId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('VEHICLE_NOT_FOUND');
  });

  it('Cross-User Ownership Isolation: User B cannot update User A vehicle', async () => {
    const res = await request(app)
      .patch(`/api/v1/vehicles/${userAVehicleId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        color: 'Midnight Black',
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('VEHICLE_NOT_FOUND');
  });

  it('PATCH /api/v1/vehicles/:id updates allowed vehicle details', async () => {
    const res = await request(app)
      .patch(`/api/v1/vehicles/${userAVehicleId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        color: 'Midnight Blue',
        capacity: 3,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.vehicle.color).toBe('Midnight Blue');
    expect(res.body.data.vehicle.capacity).toBe(3);
  });

  it('PATCH /api/v1/vehicles/:id rejects forbidden field updates (e.g. isVerified, userId)', async () => {
    const res = await request(app)
      .patch(`/api/v1/vehicles/${userAVehicleId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        isVerified: true, // Forbidden!
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');

    // Confirm is_verified is still false in database
    const rows = await query<RowDataPacket[]>('SELECT is_verified FROM vehicles WHERE id = ?;', [
      userAVehicleId,
    ]);
    expect(Boolean(rows[0].is_verified)).toBe(false);
  });

  it('Cross-User Ownership Isolation: User B cannot delete User A vehicle', async () => {
    const res = await request(app)
      .delete(`/api/v1/vehicles/${userAVehicleId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('VEHICLE_NOT_FOUND');
  });

  it('DELETE /api/v1/vehicles/:id deactivates vehicle safely without destroying records', async () => {
    const res = await request(app)
      .delete(`/api/v1/vehicles/${userAVehicleId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('deactivated successfully');

    // Verify record still exists in MySQL for historical integrity, but is_active = 0
    const rows = await query<RowDataPacket[]>('SELECT is_active FROM vehicles WHERE id = ?;', [
      userAVehicleId,
    ]);
    expect(rows.length).toBe(1);
    expect(Boolean(rows[0].is_active)).toBe(false);

    // Verify it is no longer returned in GET /api/v1/vehicles
    const listRes = await request(app)
      .get('/api/v1/vehicles')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(listRes.body.data.vehicles.length).toBe(1); // Only the bike remains active
    expect(listRes.body.data.vehicles.some((v: Vehicle) => v.id === userAVehicleId)).toBe(false);
  });
});
