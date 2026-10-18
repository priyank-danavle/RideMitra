import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { RowDataPacket } from 'mysql2';
import { app } from '../src/app.js';
import { query } from '../src/db/index.js';

describe('Phase 5.1 Backend Lifecycle Invariants & Authorization Enforcement', () => {
  let driver1Id: string;
  let driver1Token: string;
  let driver1VehicleId: string;

  let driver2Id: string;
  let driver2Token: string;

  let passenger1Id: string;
  let passenger1Token: string;

  let passenger2Id: string;
  let passenger2Token: string;

  beforeAll(async () => {
    // 1. Register Driver 1
    const d1Res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Arun Driver One',
        email: `arun.d1.${Date.now()}@example.com`,
        password: 'Password123!',
      });
    driver1Id = d1Res.body.data.user.id;
    driver1Token = d1Res.body.data.token;

    // Register Vehicle for Driver 1
    const v1Res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${driver1Token}`)
      .send({
        type: 'CAR',
        make: 'Tata',
        model: 'Safari',
        year: 2023,
        color: 'Starlight Black',
        registrationNumber: `GJ-01-LA-${Date.now().toString().slice(-4)}`,
        capacity: 6,
      });
    driver1VehicleId = v1Res.body.data.vehicle.id;

    // 2. Register Driver 2
    const d2Res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Divya Driver Two',
        email: `divya.d2.${Date.now()}@example.com`,
        password: 'Password123!',
      });
    driver2Id = d2Res.body.data.user.id;
    driver2Token = d2Res.body.data.token;

    // Register Vehicle for Driver 2
    await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${driver2Token}`)
      .send({
        type: 'CAR',
        make: 'Hyundai',
        model: 'Creta',
        year: 2022,
        color: 'Polar White',
        registrationNumber: `GJ-01-LB-${Date.now().toString().slice(-4)}`,
        capacity: 4,
      });

    // 3. Register Passenger 1
    const p1Res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Pooja Passenger One',
        email: `pooja.p1.${Date.now()}@example.com`,
        password: 'Password123!',
      });
    passenger1Id = p1Res.body.data.user.id;
    passenger1Token = p1Res.body.data.token;

    // 4. Register Passenger 2
    const p2Res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Karan Passenger Two',
        email: `karan.p2.${Date.now()}@example.com`,
        password: 'Password123!',
      });
    passenger2Id = p2Res.body.data.user.id;
    passenger2Token = p2Res.body.data.token;
  });

  afterAll(async () => {
    // Cleanup users (cascades to vehicles, rides, bookings, sessions)
    const userIds = [driver1Id, driver2Id, passenger1Id, passenger2Id].filter(Boolean);
    for (const uid of userIds) {
      await query('DELETE FROM users WHERE id = ?;', [uid]);
    }
  });

  describe('Seat Validation Boundary Conditions', () => {
    let testRideId: string;

    beforeAll(async () => {
      const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
      const res = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driver1Token}`)
        .send({
          vehicleId: driver1VehicleId,
          type: 'INTERCITY',
          origin: 'Ahmedabad',
          destination: 'Surat',
          departureTime: futureDate,
          availableSeats: 4,
          pricePerSeat: 300,
        });
      testRideId = res.body.data.ride.id;
    });

    it('rejects booking creation when seatsBooked is zero', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ rideId: testRideId, seatsBooked: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects booking creation when seatsBooked is negative', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ rideId: testRideId, seatsBooked: -1 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects booking creation when seatsBooked is a decimal number', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ rideId: testRideId, seatsBooked: 2.5 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects booking creation when seatsBooked exceeds max allowed single request (> 8)', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ rideId: testRideId, seatsBooked: 9 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects booking creation when seatsBooked is not a number', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ rideId: testRideId, seatsBooked: 'two' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects booking creation when rideId is non-existent', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ rideId: nonExistentId, seatsBooked: 1 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('BOOKING_ERROR');
    });
  });

  describe('Vehicle Deactivation vs Ride Publishing', () => {
    it('prevents a driver from publishing a ride using an inactive (soft-deleted) vehicle', async () => {
      // 1. Register a temporary vehicle
      const regRes = await request(app)
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${driver1Token}`)
        .send({
          type: 'CAR',
          make: 'Maruti',
          model: 'Swift',
          year: 2021,
          color: 'Silky Silver',
          registrationNumber: `GJ-01-XX-${Date.now().toString().slice(-4)}`,
          capacity: 4,
        });
      const tempVehicleId = regRes.body.data.vehicle.id;

      // 2. Deactivate the vehicle
      const delRes = await request(app)
        .delete(`/api/v1/vehicles/${tempVehicleId}`)
        .set('Authorization', `Bearer ${driver1Token}`);
      expect(delRes.status).toBe(200);

      // 3. Attempt to publish a ride using the deactivated vehicle
      const futureDate = new Date(Date.now() + 86400000 * 4).toISOString();
      const rideRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driver1Token}`)
        .send({
          vehicleId: tempVehicleId,
          type: 'CITY',
          origin: 'Vastrapur',
          destination: 'Prahlad Nagar',
          departureTime: futureDate,
          availableSeats: 2,
          pricePerSeat: 80,
        });

      expect(rideRes.status).toBe(400);
      expect(rideRes.body.error.code).toBe('VEHICLE_INACTIVE');
    });
  });

  describe('Booking Invariants on Non-Bookable Rides', () => {
    it('rejects booking requests on an already CANCELLED ride', async () => {
      // Create and cancel a ride
      const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
      const rideRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driver1Token}`)
        .send({
          vehicleId: driver1VehicleId,
          type: 'INTERCITY',
          origin: 'Ahmedabad',
          destination: 'Rajkot',
          departureTime: futureDate,
          availableSeats: 3,
          pricePerSeat: 350,
        });
      const rideId = rideRes.body.data.ride.id;

      await request(app)
        .post(`/api/v1/rides/${rideId}/cancel`)
        .set('Authorization', `Bearer ${driver1Token}`);

      // Passenger attempts to book cancelled ride
      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ rideId, seatsBooked: 1 });

      expect(bookRes.status).toBe(400);
      expect(bookRes.body.error.message).toMatch(/cannot book ride.*cancelled/i);
    });

    it('rejects booking requests on a COMPLETED ride', async () => {
      // Create a ride and mark it COMPLETED in the database
      const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
      const rideRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driver1Token}`)
        .send({
          vehicleId: driver1VehicleId,
          type: 'INTERCITY',
          origin: 'Ahmedabad',
          destination: 'Bhavnagar',
          departureTime: futureDate,
          availableSeats: 3,
          pricePerSeat: 300,
        });
      const rideId = rideRes.body.data.ride.id;

      await query("UPDATE rides SET status = 'COMPLETED' WHERE id = ?;", [rideId]);

      // Passenger attempts to book completed ride
      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ rideId, seatsBooked: 1 });

      expect(bookRes.status).toBe(400);
      expect(bookRes.body.error.message).toMatch(/cannot book ride.*completed/i);
    });

    it('rejects booking requests when ride departure time has already passed', async () => {
      // Create ride then simulate departure time in past
      const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
      const rideRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driver1Token}`)
        .send({
          vehicleId: driver1VehicleId,
          type: 'CITY',
          origin: 'Akota',
          destination: 'Alkapuri',
          departureTime: futureDate,
          availableSeats: 2,
          pricePerSeat: 50,
        });
      const rideId = rideRes.body.data.ride.id;

      // Update departure time to 2 hours ago
      await query("UPDATE rides SET departure_time = DATE_SUB(NOW(), INTERVAL 2 HOUR) WHERE id = ?;", [
        rideId,
      ]);

      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ rideId, seatsBooked: 1 });

      expect(bookRes.status).toBe(400);
      expect(bookRes.body.error.message).toMatch(/departure time has already passed/i);
    });
  });

  describe('Invalid Booking State Transitions', () => {
    let rideId: string;
    let bookingId: string;

    beforeEach(async () => {
      const futureDate = new Date(Date.now() + 86400000 * 6).toISOString();
      const rideRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driver1Token}`)
        .send({
          vehicleId: driver1VehicleId,
          type: 'INTERCITY',
          origin: 'Baroda',
          destination: 'Surat',
          departureTime: futureDate,
          availableSeats: 3,
          pricePerSeat: 200,
        });
      rideId = rideRes.body.data.ride.id;

      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ rideId, seatsBooked: 1 });
      bookingId = bookRes.body.data.booking.id;
    });

    it('rejects confirmation of an already REJECTED booking', async () => {
      // Driver rejects booking
      await request(app)
        .post(`/api/v1/bookings/${bookingId}/reject`)
        .set('Authorization', `Bearer ${driver1Token}`);

      // Driver attempts to confirm rejected booking
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${driver1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/current status is REJECTED/i);
    });

    it('rejects confirmation of an already CANCELLED booking', async () => {
      // Passenger cancels pending booking
      await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${passenger1Token}`);

      // Driver attempts to confirm cancelled booking
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${driver1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/current status is CANCELLED/i);
    });

    it('rejects rejection of an already CONFIRMED booking', async () => {
      // Driver confirms booking
      await request(app)
        .post(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${driver1Token}`);

      // Driver attempts to reject confirmed booking
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/reject`)
        .set('Authorization', `Bearer ${driver1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/current status is CONFIRMED.*Only PENDING/i);
    });

    it('rejects cancellation of an already REJECTED booking', async () => {
      // Driver rejects booking
      await request(app)
        .post(`/api/v1/bookings/${bookingId}/reject`)
        .set('Authorization', `Bearer ${driver1Token}`);

      // Passenger attempts to cancel rejected booking
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${passenger1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/cannot cancel a rejected booking/i);
    });

    it('rejects cancellation of an already COMPLETED booking', async () => {
      // Manually set booking to COMPLETED
      await query("UPDATE bookings SET status = 'COMPLETED' WHERE id = ?;", [bookingId]);

      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${passenger1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/cannot cancel an already completed booking/i);
    });
  });

  describe('Authorization & Cross-Tenant Access Control', () => {
    let driver1RideId: string;
    let passenger1BookingId: string;

    beforeAll(async () => {
      const futureDate = new Date(Date.now() + 86400000 * 7).toISOString();
      const rRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driver1Token}`)
        .send({
          vehicleId: driver1VehicleId,
          type: 'INTERCITY',
          origin: 'Ahmedabad',
          destination: 'Udaipur',
          departureTime: futureDate,
          availableSeats: 4,
          pricePerSeat: 600,
        });
      driver1RideId = rRes.body.data.ride.id;

      const bRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ rideId: driver1RideId, seatsBooked: 2 });
      passenger1BookingId = bRes.body.data.booking.id;
    });

    it('prevents Driver 2 from confirming a booking on Driver 1 ride (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${passenger1BookingId}/confirm`)
        .set('Authorization', `Bearer ${driver2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/not authorized to confirm bookings/i);
    });

    it('prevents Driver 2 from rejecting a booking on Driver 1 ride (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${passenger1BookingId}/reject`)
        .set('Authorization', `Bearer ${driver2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/not authorized to manage bookings/i);
    });

    it('prevents Passenger 2 (unrelated) from cancelling Passenger 1 booking (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${passenger1BookingId}/cancel`)
        .set('Authorization', `Bearer ${passenger2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/not authorized to cancel this booking/i);
    });

    it('allows Passenger 1 (creator) and Driver 1 (host) to view booking by ID', async () => {
      // Passenger 1 can view
      const pRes = await request(app)
        .get(`/api/v1/bookings/${passenger1BookingId}`)
        .set('Authorization', `Bearer ${passenger1Token}`);
      expect(pRes.status).toBe(200);
      expect(pRes.body.data.booking.id).toBe(passenger1BookingId);

      // Driver 1 can view
      const dRes = await request(app)
        .get(`/api/v1/bookings/${passenger1BookingId}`)
        .set('Authorization', `Bearer ${driver1Token}`);
      expect(dRes.status).toBe(200);
      expect(dRes.body.data.booking.id).toBe(passenger1BookingId);
    });

    it('forbids unrelated Passenger 2 from viewing Passenger 1 booking by ID (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${passenger1BookingId}`)
        .set('Authorization', `Bearer ${passenger2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects unauthenticated booking view requests (401)', async () => {
      const res = await request(app).get(`/api/v1/bookings/${passenger1BookingId}`);
      expect(res.status).toBe(401);
    });

    it('authorizes ride owner to inspect all bookings for their ride, but forbids other users', async () => {
      // 1. Host Driver 1 can inspect bookings for driver1RideId
      const hostRes = await request(app)
        .get(`/api/v1/bookings/ride/${driver1RideId}`)
        .set('Authorization', `Bearer ${driver1Token}`);

      expect(hostRes.status).toBe(200);
      expect(Array.isArray(hostRes.body.data.bookings)).toBe(true);
      expect(hostRes.body.data.bookings.length).toBeGreaterThanOrEqual(1);

      // 2. Unrelated Driver 2 gets 403 Forbidden
      const unauthorizedRes = await request(app)
        .get(`/api/v1/bookings/ride/${driver1RideId}`)
        .set('Authorization', `Bearer ${driver2Token}`);

      expect(unauthorizedRes.status).toBe(403);
      expect(unauthorizedRes.body.error.code).toBe('FORBIDDEN');

      // 3. Unauthenticated request gets 401
      const unauthRes = await request(app).get(`/api/v1/bookings/ride/${driver1RideId}`);
      expect(unauthRes.status).toBe(401);
    });
  });

  describe('Driver Cancellation of a Ride with Active Bookings', () => {
    it('cancels all pending and confirmed bookings when driver cancels the ride', async () => {
      // 1. Driver 1 creates a ride with 4 seats
      const futureDate = new Date(Date.now() + 86400000 * 8).toISOString();
      const rideRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driver1Token}`)
        .send({
          vehicleId: driver1VehicleId,
          type: 'INTERCITY',
          origin: 'Ahmedabad',
          destination: 'Jaipur',
          departureTime: futureDate,
          availableSeats: 4,
          pricePerSeat: 700,
        });
      const rideId = rideRes.body.data.ride.id;

      // 2. Passenger 1 creates a booking for 1 seat, Driver 1 confirms it
      const b1Res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ rideId, seatsBooked: 1 });
      const b1Id = b1Res.body.data.booking.id;

      const confirmRes = await request(app)
        .post(`/api/v1/bookings/${b1Id}/confirm`)
        .set('Authorization', `Bearer ${driver1Token}`);
      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.data.booking.status).toBe('CONFIRMED');

      // 3. Passenger 2 creates a booking for 1 seat (remains PENDING)
      const b2Res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger2Token}`)
        .send({ rideId, seatsBooked: 1 });
      const b2Id = b2Res.body.data.booking.id;
      expect(b2Res.body.data.booking.status).toBe('PENDING');

      // 4. Driver 1 cancels the ride
      const cancelRideRes = await request(app)
        .post(`/api/v1/rides/${rideId}/cancel`)
        .set('Authorization', `Bearer ${driver1Token}`);

      expect(cancelRideRes.status).toBe(200);

      // 5. Verify Ride is marked CANCELLED in DB
      const [rideRow] = await query<RowDataPacket[]>('SELECT status FROM rides WHERE id = ?;', [rideId]);
      expect(rideRow.status).toBe('CANCELLED');

      // 6. Verify BOTH Passenger 1 (previously CONFIRMED) and Passenger 2 (previously PENDING)
      // are transitioned to CANCELLED
      const bookingRows = await query<RowDataPacket[]>(
        'SELECT id, status FROM bookings WHERE ride_id = ? ORDER BY id ASC;',
        [rideId],
      );
      for (const row of bookingRows) {
        expect(row.status).toBe('CANCELLED');
      }

      // 7. Driver cannot confirm Passenger 2's booking anymore
      const reConfirmRes = await request(app)
        .post(`/api/v1/bookings/${b2Id}/confirm`)
        .set('Authorization', `Bearer ${driver1Token}`);

      expect(reConfirmRes.status).toBe(400);
    });
  });
});
