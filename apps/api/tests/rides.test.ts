import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { query } from '../src/db/index.js';
import type { Ride } from '@ridemitra/shared';

describe('Phase 3 Ride Management & Discovery API', () => {
  let driverAId: string;
  let driverAToken: string;
  let driverACarId: string;
  let driverABikeId: string;

  let driverBId: string;
  let driverBToken: string;

  let createdRideId: string;

  beforeAll(async () => {
    // 1. Register Driver A
    const driverARes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Kabir Sharma',
        email: `kabir.${Date.now()}@example.com`,
        password: 'Password123!',
      });
    driverAId = driverARes.body.data.user.id;
    driverAToken = driverARes.body.data.token;

    // 2. Register Driver B
    const driverBRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Meera Deshmukh',
        email: `meera.${Date.now()}@example.com`,
        password: 'Password123!',
      });
    driverBId = driverBRes.body.data.user.id;
    driverBToken = driverBRes.body.data.token;

    // 3. Register a Car for Driver A (Capacity: 4)
    const carRes = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${driverAToken}`)
      .send({
        type: 'CAR',
        make: 'Honda',
        model: 'City',
        year: 2021,
        color: 'Radiant Red',
        registrationNumber: `GJ-01-KS-${Date.now().toString().slice(-4)}`,
        capacity: 4,
      });
    driverACarId = carRes.body.data.vehicle.id;

    // 4. Register a Bike for Driver A (Capacity: 1)
    const bikeRes = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${driverAToken}`)
      .send({
        type: 'BIKE',
        make: 'Royal Enfield',
        model: 'Hunter 350',
        year: 2023,
        color: 'Dapper Ash',
        registrationNumber: `GJ-01-BK-${Date.now().toString().slice(-4)}`,
        capacity: 1,
      });
    driverABikeId = bikeRes.body.data.vehicle.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (driverAId) {
      await query('DELETE FROM users WHERE id = ?;', [driverAId]);
    }
    if (driverBId) {
      await query('DELETE FROM users WHERE id = ?;', [driverBId]);
    }
  });

  it('POST /api/v1/rides should successfully publish a new intercity carpool ride', async () => {
    // 24 hours in the future
    const departure = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/v1/rides')
      .set('Authorization', `Bearer ${driverAToken}`)
      .send({
        vehicleId: driverACarId,
        type: 'INTERCITY',
        origin: 'Ahmedabad',
        destination: 'Surat',
        pickupPoint: 'ISCON Cross Roads, SG Highway',
        dropoffPoint: 'Varachha Main Road',
        departureTime: departure,
        availableSeats: 3,
        pricePerSeat: 450,
        description: 'AC carpool, non-smoking, polite passengers welcome.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ride).toBeDefined();
    expect(res.body.data.ride.origin).toBe('Ahmedabad');
    expect(res.body.data.ride.destination).toBe('Surat');
    expect(res.body.data.ride.availableSeats).toBe(3);
    expect(res.body.data.ride.pricePerSeat).toBe(450);
    expect(res.body.data.ride.status).toBe('SCHEDULED');
    expect(res.body.data.ride.driver).toBeDefined();
    expect(res.body.data.ride.driver.name).toBe('Kabir Sharma');
    expect(res.body.data.ride.vehicle).toBeDefined();
    expect(res.body.data.ride.vehicle.make).toBe('Honda');

    createdRideId = res.body.data.ride.id;
  });

  it('POST /api/v1/rides should reject departure time in the past', async () => {
    // 2 hours in the past
    const pastDeparture = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/v1/rides')
      .set('Authorization', `Bearer ${driverAToken}`)
      .send({
        vehicleId: driverACarId,
        type: 'INTERCITY',
        origin: 'Ahmedabad',
        destination: 'Surat',
        departureTime: pastDeparture,
        availableSeats: 2,
        pricePerSeat: 400,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('future date and time');
  });

  it('POST /api/v1/rides should reject seats exceeding vehicle capacity', async () => {
    const departure = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // Car capacity is 4, attempting to offer 5 seats
    const res = await request(app)
      .post('/api/v1/rides')
      .set('Authorization', `Bearer ${driverAToken}`)
      .send({
        vehicleId: driverACarId,
        type: 'INTERCITY',
        origin: 'Ahmedabad',
        destination: 'Vadodara',
        departureTime: departure,
        availableSeats: 5,
        pricePerSeat: 200,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('cannot exceed the registered vehicle capacity');
  });

  it('POST /api/v1/rides should enforce exactly 1 passenger seat for Bikepool', async () => {
    const departure = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // Attempting to offer 2 seats on a bike
    const res = await request(app)
      .post('/api/v1/rides')
      .set('Authorization', `Bearer ${driverAToken}`)
      .send({
        vehicleId: driverABikeId,
        type: 'CITY',
        origin: 'Vastrapur',
        destination: 'GIFT City',
        departureTime: departure,
        availableSeats: 2,
        pricePerSeat: 100,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Bikepool rides can offer exactly 1 passenger seat');
  });

  it('POST /api/v1/rides should reject vehicle belonging to another user', async () => {
    const departure = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // Driver B tries to use Driver A's car
    const res = await request(app)
      .post('/api/v1/rides')
      .set('Authorization', `Bearer ${driverBToken}`)
      .send({
        vehicleId: driverACarId,
        type: 'INTERCITY',
        origin: 'Vadodara',
        destination: 'Surat',
        departureTime: departure,
        availableSeats: 2,
        pricePerSeat: 300,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('not registered to your account');
  });

  it('GET /api/v1/rides should discover rides matching search filters', async () => {
    const res = await request(app).get('/api/v1/rides').query({
      origin: 'Ahmedabad',
      destination: 'Surat',
      vehicleType: 'CAR',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);

    const found = res.body.data.items.find((r: Ride) => r.id === createdRideId);
    expect(found).toBeDefined();
    expect(found.vehicle.type).toBe('CAR');
    expect(found.pricePerSeat).toBe(450);
  });

  it('GET /api/v1/rides should support sorting by price and departure time', async () => {
    const res = await request(app).get('/api/v1/rides').query({
      sortBy: 'price',
      sortOrder: 'asc',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('GET /api/v1/rides/:id should return complete ride details', async () => {
    const res = await request(app).get(`/api/v1/rides/${createdRideId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ride.id).toBe(createdRideId);
    expect(res.body.data.ride.driver.name).toBe('Kabir Sharma');
    expect(res.body.data.ride.vehicle.model).toBe('City');
    // Public profile should NOT contain sensitive data
    expect(res.body.data.ride.driver).not.toHaveProperty('phone');
    expect(res.body.data.ride.driver).not.toHaveProperty('email');
  });

  it('GET /api/v1/rides/my-rides should return rides offered by the driver', async () => {
    const res = await request(app)
      .get('/api/v1/rides/my-rides')
      .set('Authorization', `Bearer ${driverAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rides.some((r: Ride) => r.id === createdRideId)).toBe(true);
  });

  it('PATCH /api/v1/rides/:id should update eligible ride details for owner', async () => {
    const res = await request(app)
      .patch(`/api/v1/rides/${createdRideId}`)
      .set('Authorization', `Bearer ${driverAToken}`)
      .send({
        pricePerSeat: 480,
        description: 'Updated route notes: pickup at ISCON flyover.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ride.pricePerSeat).toBe(480);
    expect(res.body.data.ride.description).toContain('pickup at ISCON flyover');
  });

  it('PATCH /api/v1/rides/:id should prevent modifying another driver ride', async () => {
    const res = await request(app)
      .patch(`/api/v1/rides/${createdRideId}`)
      .set('Authorization', `Bearer ${driverBToken}`)
      .send({
        pricePerSeat: 100,
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/rides/:id/cancel should cancel the ride and exclude it from discovery', async () => {
    // 1. Cancel ride
    const cancelRes = await request(app)
      .post(`/api/v1/rides/${createdRideId}/cancel`)
      .set('Authorization', `Bearer ${driverAToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);

    // 2. Check ride details reflects CANCELLED
    const detailRes = await request(app).get(`/api/v1/rides/${createdRideId}`);
    expect(detailRes.body.data.ride.status).toBe('CANCELLED');

    // 3. Search should NO LONGER return the cancelled ride
    const searchRes = await request(app).get('/api/v1/rides').query({
      origin: 'Ahmedabad',
      destination: 'Surat',
    });

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.items.some((r: Ride) => r.id === createdRideId)).toBe(false);
  });

  describe('Phase 5.3 Location Coordinates & Backward Compatibility', () => {
    let geoRideId: string;

    it('POST /api/v1/rides should publish ride with valid coordinates and distance metrics', async () => {
      const departure = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverAToken}`)
        .send({
          vehicleId: driverACarId,
          type: 'INTERCITY',
          origin: 'Ahmedabad',
          destination: 'Surat',
          pickupPoint: 'ISCON Cross Roads',
          dropoffPoint: 'Majura Gate',
          pickupLat: 23.0225123,
          pickupLng: 72.5714456,
          dropoffLat: 21.1702789,
          dropoffLng: 72.8311123,
          distanceKm: 265.4,
          durationMinutes: 270,
          departureTime: departure,
          availableSeats: 3,
          pricePerSeat: 450,
          description: 'Route with coordinates and OSRM distance metrics.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const ride = res.body.data.ride;
      expect(ride.pickupLat).toBeCloseTo(23.0225123, 5);
      expect(ride.pickupLng).toBeCloseTo(72.5714456, 5);
      expect(ride.dropoffLat).toBeCloseTo(21.1702789, 5);
      expect(ride.dropoffLng).toBeCloseTo(72.8311123, 5);
      expect(ride.distanceKm).toBeCloseTo(265.4, 1);
      expect(ride.durationMinutes).toBe(270);

      geoRideId = ride.id;
    });

    it('GET /api/v1/rides/:id should return exact saved coordinates', async () => {
      const res = await request(app).get(`/api/v1/rides/${geoRideId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const ride = res.body.data.ride;
      expect(ride.pickupLat).toBeCloseTo(23.0225123, 5);
      expect(ride.pickupLng).toBeCloseTo(72.5714456, 5);
      expect(ride.distanceKm).toBe(265.4);
      expect(ride.durationMinutes).toBe(270);
    });

    it('POST /api/v1/rides should reject out-of-range latitude (> 90)', async () => {
      const departure = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverAToken}`)
        .send({
          vehicleId: driverACarId,
          type: 'INTERCITY',
          origin: 'Ahmedabad',
          destination: 'Surat',
          pickupLat: 95.5, // Invalid: exceeds 90
          pickupLng: 72.57,
          dropoffLat: 21.17,
          dropoffLng: 72.83,
          departureTime: departure,
          availableSeats: 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('between -90 and 90');
    });

    it('POST /api/v1/rides should reject coordinate pair when latitude is provided without longitude', async () => {
      const departure = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverAToken}`)
        .send({
          vehicleId: driverACarId,
          type: 'INTERCITY',
          origin: 'Ahmedabad',
          destination: 'Surat',
          pickupLat: 23.02,
          // pickupLng is missing!
          dropoffLat: 21.17,
          dropoffLng: 72.83,
          departureTime: departure,
          availableSeats: 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('provided together');
    });

    it('Legacy rides without coordinates should return null coordinate values cleanly without breaking discovery', async () => {
      const departure = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();

      // Create a ride WITHOUT coordinates (like legacy rides from Phase 3/4)
      const res = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverAToken}`)
        .send({
          vehicleId: driverACarId,
          type: 'INTERCITY',
          origin: 'Surat',
          destination: 'Vadodara',
          departureTime: departure,
          availableSeats: 2,
        });

      expect(res.status).toBe(201);
      const ride = res.body.data.ride;
      expect(ride.pickupLat).toBeNull();
      expect(ride.pickupLng).toBeNull();
      expect(ride.dropoffLat).toBeNull();
      expect(ride.dropoffLng).toBeNull();
      expect(ride.distanceKm).toBeNull();
      expect(ride.durationMinutes).toBeNull();

      // Search rides and verify legacy ride is returned seamlessly
      const searchRes = await request(app).get('/api/v1/rides').query({
        origin: 'Surat',
        destination: 'Vadodara',
      });
      expect(searchRes.status).toBe(200);
      const found = searchRes.body.data.items.find((r: Ride) => r.id === ride.id);
      expect(found).toBeDefined();
      expect(found.pickupLat).toBeNull();
    });

    it('POST /api/v1/rides should reject zero and negative distanceKm and durationMinutes', async () => {
      const departure = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();

      // Test zero distanceKm
      const zeroDistRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverAToken}`)
        .send({
          vehicleId: driverACarId,
          type: 'INTERCITY',
          origin: 'Ahmedabad',
          destination: 'Surat',
          distanceKm: 0,
          departureTime: departure,
          availableSeats: 2,
        });

      expect(zeroDistRes.status).toBe(400);
      expect(zeroDistRes.body.success).toBe(false);
      expect(zeroDistRes.body.error.message).toContain('greater than 0');

      // Test negative distanceKm
      const negDistRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverAToken}`)
        .send({
          vehicleId: driverACarId,
          type: 'INTERCITY',
          origin: 'Ahmedabad',
          destination: 'Surat',
          distanceKm: -25.5,
          departureTime: departure,
          availableSeats: 2,
        });

      expect(negDistRes.status).toBe(400);
      expect(negDistRes.body.success).toBe(false);
      expect(negDistRes.body.error.message).toContain('greater than 0');

      // Test zero durationMinutes
      const zeroDurRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverAToken}`)
        .send({
          vehicleId: driverACarId,
          type: 'INTERCITY',
          origin: 'Ahmedabad',
          destination: 'Surat',
          durationMinutes: 0,
          departureTime: departure,
          availableSeats: 2,
        });

      expect(zeroDurRes.status).toBe(400);
      expect(zeroDurRes.body.success).toBe(false);
      expect(zeroDurRes.body.error.message).toContain('greater than 0');

      // Test negative durationMinutes
      const negDurRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverAToken}`)
        .send({
          vehicleId: driverACarId,
          type: 'INTERCITY',
          origin: 'Ahmedabad',
          destination: 'Surat',
          durationMinutes: -120,
          departureTime: departure,
          availableSeats: 2,
        });

      expect(negDurRes.status).toBe(400);
      expect(negDurRes.body.success).toBe(false);
      expect(negDurRes.body.error.message).toContain('greater than 0');
    });

    it('POST /api/v1/rides should accept valid positive distanceKm and durationMinutes', async () => {
      const departure = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverAToken}`)
        .send({
          vehicleId: driverACarId,
          type: 'INTERCITY',
          origin: 'Ahmedabad',
          destination: 'Surat',
          pickupLat: 23.0225,
          pickupLng: 72.5714,
          dropoffLat: 21.1702,
          dropoffLng: 72.8311,
          distanceKm: 265.4,
          durationMinutes: 270,
          departureTime: departure,
          availableSeats: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ride.distanceKm).toBe(265.4);
      expect(res.body.data.ride.durationMinutes).toBe(270);
    });
  });
});
