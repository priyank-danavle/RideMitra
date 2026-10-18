import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { query } from '../src/db/index.js';
import type { Booking } from '@ridemitra/shared';

describe('Phase 4 Booking Engine & Seat Concurrency API', () => {
  let driverId: string;
  let driverToken: string;
  let driverVehicleId: string;

  let passenger1Id: string;
  let passenger1Token: string;

  let passenger2Id: string;
  let passenger2Token: string;

  let testRideId: string;
  let testRidePrice: number;

  beforeAll(async () => {
    // 1. Register Driver
    const driverRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Arjun Driver',
        email: `arjun.driver.${Date.now()}@example.com`,
        password: 'Password123!',
      });
    driverId = driverRes.body.data.user.id;
    driverToken = driverRes.body.data.token;

    // 2. Register Vehicle for Driver (Capacity: 4)
    const vehicleRes = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        type: 'CAR',
        make: 'Tata',
        model: 'Nexon',
        year: 2023,
        color: 'Calgary White',
        registrationNumber: `GJ-06-BK-${Date.now().toString().slice(-4)}`,
        capacity: 4,
      });
    driverVehicleId = vehicleRes.body.data.vehicle.id;

    // 3. Register Passenger 1
    const p1Res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Bhavik Passenger',
        email: `bhavik.p1.${Date.now()}@example.com`,
        password: 'Password123!',
      });
    passenger1Id = p1Res.body.data.user.id;
    passenger1Token = p1Res.body.data.token;

    // 4. Register Passenger 2
    const p2Res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Chirag Passenger',
        email: `chirag.p2.${Date.now()}@example.com`,
        password: 'Password123!',
      });
    passenger2Id = p2Res.body.data.user.id;
    passenger2Token = p2Res.body.data.token;

    // 5. Create a test ride with 2 available seats
    testRidePrice = 250;
    const futureDate = new Date(Date.now() + 86400000 * 3).toISOString();
    const rideRes = await request(app)
      .post('/api/v1/rides')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        vehicleId: driverVehicleId,
        type: 'INTERCITY',
        origin: 'Vadodara',
        destination: 'Ahmedabad',
        pickupPoint: 'Akota Gardens',
        dropoffPoint: 'C.G. Road',
        departureTime: futureDate,
        availableSeats: 2,
        pricePerSeat: testRidePrice,
        description: 'Smooth weekend commute.',
      });
    testRideId = rideRes.body.data.ride.id;
  });

  afterAll(async () => {
    // Cascade delete via users
    if (driverId) await query('DELETE FROM users WHERE id = ?;', [driverId]);
    if (passenger1Id) await query('DELETE FROM users WHERE id = ?;', [passenger1Id]);
    if (passenger2Id) await query('DELETE FROM users WHERE id = ?;', [passenger2Id]);
  });

  describe('POST /api/v1/bookings (Request Booking)', () => {
    it('successfully creates a pending booking with server-calculated price', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({
          rideId: testRideId,
          seatsBooked: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking).toBeDefined();

      const booking: Booking = res.body.data.booking;
      expect(booking.passengerId).toBe(passenger1Id);
      expect(booking.rideId).toBe(testRideId);
      expect(booking.seatsBooked).toBe(1);
      expect(booking.pricePerSeat).toBe(testRidePrice);
      expect(booking.totalPrice).toBe(testRidePrice * 1);
      expect(booking.status).toBe('PENDING');
      expect(booking.passenger?.name).toBe('Bhavik Passenger');
      expect(booking.ride?.origin).toBe('Vadodara');
    });

    it('rejects duplicate active booking request by the same passenger on the same ride', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({
          rideId: testRideId,
          seatsBooked: 1,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_ACTIVE_BOOKING');
    });

    it('prevents a driver from booking a seat on their own offered ride', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          rideId: testRideId,
          seatsBooked: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/own offered ride/i);
    });

    it('rejects booking requests that exceed currently available capacity', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger2Token}`)
        .send({
          rideId: testRideId,
          seatsBooked: 5, // Ride only has 2 seats
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_SEATS');
    });
  });

  describe('GET /api/v1/bookings (Listing & Authorization)', () => {
    it('allows passenger to list their own bookings', async () => {
      const res = await request(app)
        .get('/api/v1/bookings/passenger/mine')
        .set('Authorization', `Bearer ${passenger1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.bookings)).toBe(true);
      expect(res.body.data.bookings.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.bookings[0].passengerId).toBe(passenger1Id);
    });

    it('allows driver to list booking requests for their rides', async () => {
      const res = await request(app)
        .get('/api/v1/bookings/driver/mine')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookings.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.bookings[0].ride.driverId).toBe(driverId);
    });

    it('prevents another user from viewing an unauthorized booking by ID', async () => {
      // Fetch passenger 1's booking ID
      const listRes = await request(app)
        .get('/api/v1/bookings/passenger/mine')
        .set('Authorization', `Bearer ${passenger1Token}`);
      const bookingId = listRes.body.data.bookings[0].id;

      // Passenger 2 attempts to fetch Passenger 1's booking
      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${passenger2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Driver Decision Workflow (Confirm & Reject)', () => {
    let pendingBookingId: string;

    beforeAll(async () => {
      // Passenger 2 requests 1 seat
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger2Token}`)
        .send({
          rideId: testRideId,
          seatsBooked: 1,
        });
      pendingBookingId = res.body.data.booking.id;
    });

    it('rejects a pending booking without altering ride capacity', async () => {
      // Check ride available seats before
      const rideBefore = await query<any[]>('SELECT available_seats FROM rides WHERE id = ?;', [
        testRideId,
      ]);
      const seatsBefore = Number(rideBefore[0].available_seats);

      const res = await request(app)
        .post(`/api/v1/bookings/${pendingBookingId}/reject`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe('REJECTED');

      // Verify ride capacity remained unchanged
      const rideAfter = await query<any[]>('SELECT available_seats FROM rides WHERE id = ?;', [
        testRideId,
      ]);
      expect(Number(rideAfter[0].available_seats)).toBe(seatsBefore);
    });

    it('confirms a pending booking and decrements ride capacity', async () => {
      // Fetch Passenger 1's pending booking
      const p1List = await request(app)
        .get('/api/v1/bookings/passenger/mine')
        .set('Authorization', `Bearer ${passenger1Token}`);
      const p1BookingId = p1List.body.data.bookings.find((b: Booking) => b.status === 'PENDING').id;

      const rideBefore = await query<any[]>('SELECT available_seats FROM rides WHERE id = ?;', [
        testRideId,
      ]);
      const seatsBefore = Number(rideBefore[0].available_seats);

      const res = await request(app)
        .post(`/api/v1/bookings/${p1BookingId}/confirm`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe('CONFIRMED');

      // Verify available seats decremented by 1
      const rideAfter = await query<any[]>('SELECT available_seats FROM rides WHERE id = ?;', [
        testRideId,
      ]);
      expect(Number(rideAfter[0].available_seats)).toBe(seatsBefore - 1);
    });
  });

  describe('Cancellation and Seat Release', () => {
    it('cancels a confirmed booking and restores available capacity exactly once', async () => {
      // Fetch Passenger 1's confirmed booking
      const p1List = await request(app)
        .get('/api/v1/bookings/passenger/mine')
        .set('Authorization', `Bearer ${passenger1Token}`);
      const confirmedBooking = p1List.body.data.bookings.find(
        (b: Booking) => b.status === 'CONFIRMED',
      );

      const rideBefore = await query<any[]>('SELECT available_seats FROM rides WHERE id = ?;', [
        testRideId,
      ]);
      const seatsBefore = Number(rideBefore[0].available_seats);

      // Passenger 1 cancels booking
      const cancelRes = await request(app)
        .post(`/api/v1/bookings/${confirmedBooking.id}/cancel`)
        .set('Authorization', `Bearer ${passenger1Token}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.booking.status).toBe('CANCELLED');

      // Verify available seats incremented back by 1
      const rideAfter = await query<any[]>('SELECT available_seats FROM rides WHERE id = ?;', [
        testRideId,
      ]);
      expect(Number(rideAfter[0].available_seats)).toBe(seatsBefore + 1);

      // Attempting to cancel again must be rejected without releasing extra seats
      const duplicateCancelRes = await request(app)
        .post(`/api/v1/bookings/${confirmedBooking.id}/cancel`)
        .set('Authorization', `Bearer ${passenger1Token}`);

      expect(duplicateCancelRes.status).toBe(400);

      const rideAfterDuplicate = await query<any[]>(
        'SELECT available_seats FROM rides WHERE id = ?;',
        [testRideId],
      );
      expect(Number(rideAfterDuplicate[0].available_seats)).toBe(seatsBefore + 1);
    });
  });

  describe('Concurrency & Race Condition Elimination', () => {
    it('prevents overbooking when two requests concurrently compete for the final remaining seat', async () => {
      // 1. Create a ride with strictly 1 available seat
      const futureDate = new Date(Date.now() + 86400000 * 4).toISOString();
      const rideRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          vehicleId: driverVehicleId,
          type: 'CITY',
          origin: 'Surat',
          destination: 'Navsari',
          departureTime: futureDate,
          availableSeats: 1, // Only 1 seat!
          pricePerSeat: 100,
        });
      const soloRideId = rideRes.body.data.ride.id;

      // 2. Both Passenger 1 and Passenger 2 request the 1 seat (status PENDING)
      const p1Req = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ rideId: soloRideId, seatsBooked: 1 });
      expect(p1Req.status).toBe(201);
      const b1Id = p1Req.body.data.booking.id;

      const p2Req = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passenger2Token}`)
        .send({ rideId: soloRideId, seatsBooked: 1 });
      expect(p2Req.status).toBe(201);
      const b2Id = p2Req.body.data.booking.id;

      // 3. Driver concurrently attempts to confirm BOTH bookings in parallel
      const [resA, resB] = await Promise.all([
        request(app)
          .post(`/api/v1/bookings/${b1Id}/confirm`)
          .set('Authorization', `Bearer ${driverToken}`),
        request(app)
          .post(`/api/v1/bookings/${b2Id}/confirm`)
          .set('Authorization', `Bearer ${driverToken}`),
      ]);

      const statuses = [resA.status, resB.status].sort();

      // Exactly ONE must succeed (200) and ONE must fail with 409 Conflict
      expect(statuses).toEqual([200, 409]);

      const conflictRes = resA.status === 409 ? resA : resB;
      expect(conflictRes.body.error.code).toBe('INSUFFICIENT_SEATS');

      // 4. Verify in the database: available_seats must be EXACTLY 0, never -1
      const rideRow = await query<any[]>(
        'SELECT available_seats, total_seats FROM rides WHERE id = ?;',
        [soloRideId],
      );
      expect(Number(rideRow[0].available_seats)).toBe(0);

      // Verify that in bookings table, exactly 1 is CONFIRMED and 1 is still PENDING
      const bookingRows = await query<any[]>(
        'SELECT status FROM bookings WHERE ride_id = ? ORDER BY status ASC;',
        [soloRideId],
      );
      const bookingStatuses = bookingRows.map((r: any) => r.status);
      expect(bookingStatuses).toContain('CONFIRMED');
      expect(bookingStatuses).toContain('PENDING');
    });
  });
});
