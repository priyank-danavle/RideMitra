import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { RowDataPacket } from 'mysql2';
import { app } from '../src/app.js';
import { query } from '../src/db/index.js';

describe('Phase 5.1 Backend Concurrency & Race Condition Elimination', () => {
  let driverId: string;
  let driverToken: string;
  let driverVehicleId: string;

  const passengerTokens: string[] = [];
  const passengerIds: string[] = [];

  beforeAll(async () => {
    // 1. Register Driver
    const driverRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Concurrency Driver',
        email: `concurrency.driver.${Date.now()}@example.com`,
        password: 'Password123!',
      });
    driverId = driverRes.body.data.user.id;
    driverToken = driverRes.body.data.token;

    // 2. Register Vehicle for Driver (Capacity: 7)
    const vehicleRes = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        type: 'CAR',
        make: 'Mahindra',
        model: 'XUV700',
        year: 2024,
        color: 'Midnight Black',
        registrationNumber: `GJ-01-CC-${Date.now().toString().slice(-4)}`,
        capacity: 7,
      });
    driverVehicleId = vehicleRes.body.data.vehicle.id;

    // 3. Register 6 distinct passengers for high-concurrency contention tests
    for (let i = 1; i <= 6; i++) {
      const pRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: `Passenger ${i}`,
          email: `concur.pass${i}.${Date.now()}@example.com`,
          password: 'Password123!',
        });
      passengerIds.push(pRes.body.data.user.id);
      passengerTokens.push(pRes.body.data.token);
    }
  });

  afterAll(async () => {
    // Clean up created test accounts (cascades to vehicles, rides, bookings, and sessions)
    for (const pId of passengerIds) {
      await query('DELETE FROM users WHERE id = ?;', [pId]);
    }
    if (driverId) {
      await query('DELETE FROM users WHERE id = ?;', [driverId]);
    }
  });

  describe('Parallel Booking Creation and Confirmation Contention', () => {
    it('handles concurrent booking requests from multiple passengers simultaneously', async () => {
      // Create a ride with 4 seats
      const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
      const rideRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          vehicleId: driverVehicleId,
          type: 'INTERCITY',
          origin: 'Ahmedabad',
          destination: 'Mumbai',
          departureTime: futureDate,
          availableSeats: 4,
          pricePerSeat: 450,
        });
      expect(rideRes.status).toBe(201);
      const rideId = rideRes.body.data.ride.id;

      // 6 passengers concurrently submit booking requests
      const creationPromises = passengerTokens.map((token) =>
        request(app)
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${token}`)
          .send({ rideId, seatsBooked: 1 }),
      );

      const creationResults = await Promise.all(creationPromises);

      // All 6 booking creation requests succeed as PENDING
      for (const res of creationResults) {
        expect(res.status).toBe(201);
        expect(res.body.data.booking.status).toBe('PENDING');
      }

      const bookingIds = creationResults.map((r) => r.body.data.booking.id);

      // Driver concurrently confirms all 6 booking requests against a 4-seat ride
      const confirmationPromises = bookingIds.map((bId) =>
        request(app)
          .post(`/api/v1/bookings/${bId}/confirm`)
          .set('Authorization', `Bearer ${driverToken}`),
      );

      const confirmResults = await Promise.all(confirmationPromises);

      const successCount = confirmResults.filter((r) => r.status === 200).length;
      const conflictCount = confirmResults.filter((r) => r.status === 409).length;

      // Exactly 4 must succeed (matching ride capacity), and 2 must fail with 409 INSUFFICIENT_SEATS
      expect(successCount).toBe(4);
      expect(conflictCount).toBe(2);

      // Database integrity: available_seats must be EXACTLY 0, NEVER negative
      const [rideRow] = await query<RowDataPacket[]>('SELECT available_seats FROM rides WHERE id = ?;', [
        rideId,
      ]);
      expect(Number(rideRow.available_seats)).toBe(0);

      // Database integrity: exactly 4 bookings CONFIRMED, 2 remain PENDING
      const bookingRows = await query<RowDataPacket[]>(
        'SELECT status FROM bookings WHERE ride_id = ?;',
        [rideId],
      );
      const confirmedCount = bookingRows.filter((b) => b.status === 'CONFIRMED').length;
      const pendingCount = bookingRows.filter((b) => b.status === 'PENDING').length;

      expect(confirmedCount).toBe(4);
      expect(pendingCount).toBe(2);
    });
  });

  describe('Double Confirmation of the Same Booking', () => {
    it('prevents duplicate confirmation of the same booking under parallel requests', async () => {
      // Create a ride with 2 seats
      const futureDate = new Date(Date.now() + 86400000 * 6).toISOString();
      const rideRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          vehicleId: driverVehicleId,
          type: 'INTERCITY',
          origin: 'Surat',
          destination: 'Pune',
          departureTime: futureDate,
          availableSeats: 2,
          pricePerSeat: 500,
        });
      const rideId = rideRes.body.data.ride.id;

      // Passenger 1 requests 1 seat
      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passengerTokens[0]}`)
        .send({ rideId, seatsBooked: 1 });
      const bookingId = bookRes.body.data.booking.id;

      // Driver fires TWO concurrent confirmation requests for the EXACT same booking ID
      const [res1, res2] = await Promise.all([
        request(app)
          .post(`/api/v1/bookings/${bookingId}/confirm`)
          .set('Authorization', `Bearer ${driverToken}`),
        request(app)
          .post(`/api/v1/bookings/${bookingId}/confirm`)
          .set('Authorization', `Bearer ${driverToken}`),
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly 1 must succeed (200), and 1 must fail (400 - current status is not PENDING)
      expect(statuses).toEqual([200, 400]);

      // Seats must have decremented by only 1 (from 2 to 1), not 2
      const [rideRow] = await query<RowDataPacket[]>('SELECT available_seats FROM rides WHERE id = ?;', [
        rideId,
      ]);
      expect(Number(rideRow.available_seats)).toBe(1);
    });
  });

  describe('Cancellation Racing with Confirmation', () => {
    it('ensures atomic outcome and seat consistency when cancellation races with confirmation', async () => {
      // Create a ride with 1 seat
      const futureDate = new Date(Date.now() + 86400000 * 7).toISOString();
      const rideRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          vehicleId: driverVehicleId,
          type: 'CITY',
          origin: 'Gandhinagar',
          destination: 'Ahmedabad',
          departureTime: futureDate,
          availableSeats: 1,
          pricePerSeat: 150,
        });
      const rideId = rideRes.body.data.ride.id;

      // Passenger 2 requests 1 seat
      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passengerTokens[1]}`)
        .send({ rideId, seatsBooked: 1 });
      const bookingId = bookRes.body.data.booking.id;

      // Concurrently: Passenger 2 cancels booking while Driver attempts to confirm it
      const [cancelRes, confirmRes] = await Promise.all([
        request(app)
          .post(`/api/v1/bookings/${bookingId}/cancel`)
          .set('Authorization', `Bearer ${passengerTokens[1]}`),
        request(app)
          .post(`/api/v1/bookings/${bookingId}/confirm`)
          .set('Authorization', `Bearer ${driverToken}`),
      ]);

      // There are two valid atomic serializations:
      // Case A: Cancel won lock first:
      //   - cancelRes: 200 (PENDING -> CANCELLED)
      //   - confirmRes: 400 (Cannot confirm booking: current status is CANCELLED)
      // Case B: Confirm won lock first:
      //   - confirmRes: 200 (PENDING -> CONFIRMED, seats 1 -> 0)
      //   - cancelRes: 200 (CONFIRMED -> CANCELLED, seats restored 0 -> 1)
      if (cancelRes.status === 200 && confirmRes.status === 400) {
        expect(confirmRes.body.error.message).toMatch(/current status is CANCELLED/i);
      } else {
        expect(confirmRes.status).toBe(200);
        expect(cancelRes.status).toBe(200);
      }

      // In ALL possible execution orders:
      // 1. Final booking status MUST be CANCELLED
      const [bookingRow] = await query<RowDataPacket[]>('SELECT status FROM bookings WHERE id = ?;', [
        bookingId,
      ]);
      expect(bookingRow.status).toBe('CANCELLED');

      // 2. Ride available_seats MUST be exactly 1 (never -1, never 0, never corrupted)
      const [rideRow] = await query<RowDataPacket[]>('SELECT available_seats FROM rides WHERE id = ?;', [
        rideId,
      ]);
      expect(Number(rideRow.available_seats)).toBe(1);
    });
  });

  describe('Concurrent Cancellations of Confirmed Bookings', () => {
    it('restores seats accurately when multiple confirmed bookings are cancelled in parallel', async () => {
      // Create a ride with 3 seats
      const futureDate = new Date(Date.now() + 86400000 * 8).toISOString();
      const rideRes = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          vehicleId: driverVehicleId,
          type: 'INTERCITY',
          origin: 'Vadodara',
          destination: 'Surat',
          departureTime: futureDate,
          availableSeats: 3,
          pricePerSeat: 200,
        });
      const rideId = rideRes.body.data.ride.id;

      // 3 passengers create and get confirmed
      const confirmedBookingIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const bRes = await request(app)
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${passengerTokens[i]}`)
          .send({ rideId, seatsBooked: 1 });
        const bId = bRes.body.data.booking.id;

        await request(app)
          .post(`/api/v1/bookings/${bId}/confirm`)
          .set('Authorization', `Bearer ${driverToken}`);

        confirmedBookingIds.push(bId);
      }

      // Verify ride has 0 available seats now
      const [rideRowBefore] = await query<RowDataPacket[]>('SELECT available_seats FROM rides WHERE id = ?;', [
        rideId,
      ]);
      expect(Number(rideRowBefore.available_seats)).toBe(0);

      // All 3 passengers concurrently cancel their bookings
      const cancelPromises = confirmedBookingIds.map((bId, idx) =>
        request(app)
          .post(`/api/v1/bookings/${bId}/cancel`)
          .set('Authorization', `Bearer ${passengerTokens[idx]}`),
      );

      const cancelResults = await Promise.all(cancelPromises);

      for (const res of cancelResults) {
        expect(res.status).toBe(200);
        expect(res.body.data.booking.status).toBe('CANCELLED');
      }

      // Available seats must be restored to exactly 3 (total capacity)
      const [rideRowAfter] = await query<RowDataPacket[]>('SELECT available_seats FROM rides WHERE id = ?;', [
        rideId,
      ]);
      expect(Number(rideRowAfter.available_seats)).toBe(3);
    });
  });
});
