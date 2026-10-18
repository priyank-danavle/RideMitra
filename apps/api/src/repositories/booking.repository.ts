import crypto from 'crypto';
import type { RowDataPacket } from 'mysql2';
import type {
  Booking,
  BookingStatus,
  BookingPassengerSummary,
  BookingRideSummary,
  DriverPublicProfile,
  RideVehicleSummary,
  SpecificVehicleType,
  RideStatus,
} from '@ridemitra/shared';
import { query, withTransaction } from '../db/index.js';

export class BookingRepositoryError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = 'BOOKING_ERROR',
  ) {
    super(message);
    this.name = 'BookingRepositoryError';
  }
}

interface BookingRow extends RowDataPacket {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  price_per_seat: string | number;
  total_price: string | number;
  status: BookingStatus;
  created_at: Date | string;
  updated_at: Date | string;
  // Joined passenger
  passenger_name?: string;
  passenger_bio?: string | null;
  passenger_verified?: number | boolean;
  passenger_created_at?: Date | string;
  // Joined ride
  ride_origin?: string;
  ride_destination?: string;
  ride_pickup_point?: string | null;
  ride_dropoff_point?: string | null;
  ride_departure_time?: Date | string;
  ride_type?: 'CITY' | 'INTERCITY';
  ride_status?: RideStatus;
  ride_price_per_seat?: string | number;
  ride_available_seats?: number;
  ride_total_seats?: number;
  ride_driver_id?: string;
  // Joined driver
  driver_name?: string;
  driver_bio?: string | null;
  driver_verified?: number | boolean;
  driver_created_at?: Date | string;
  // Joined vehicle
  vehicle_id?: string;
  vehicle_type?: SpecificVehicleType;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  vehicle_capacity?: number;
  vehicle_registration_number?: string;
}

function mapRowToBooking(row: BookingRow): Booking {
  const booking: Booking = {
    id: row.id,
    rideId: row.ride_id,
    passengerId: row.passenger_id,
    seatsBooked: Number(row.seats_booked),
    pricePerSeat: Number(row.price_per_seat),
    totalPrice: Number(row.total_price),
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };

  if (row.passenger_name) {
    const passenger: BookingPassengerSummary = {
      id: row.passenger_id,
      name: row.passenger_name,
      bio: row.passenger_bio || null,
      isVerified: Boolean(row.passenger_verified),
      createdAt: row.passenger_created_at
        ? new Date(row.passenger_created_at).toISOString()
        : booking.createdAt,
    };
    booking.passenger = passenger;
  }

  if (row.ride_origin && row.ride_destination) {
    let driver: DriverPublicProfile | undefined;
    if (row.driver_name && row.ride_driver_id) {
      driver = {
        id: row.ride_driver_id,
        name: row.driver_name,
        bio: row.driver_bio || null,
        isVerified: Boolean(row.driver_verified),
        createdAt: row.driver_created_at
          ? new Date(row.driver_created_at).toISOString()
          : booking.createdAt,
      };
    }

    let vehicle: RideVehicleSummary | undefined;
    if (row.vehicle_id && row.vehicle_type) {
      vehicle = {
        id: row.vehicle_id,
        type: row.vehicle_type,
        make: row.vehicle_make || '',
        model: row.vehicle_model || '',
        year: Number(row.vehicle_year || 0),
        color: row.vehicle_color || '',
        capacity: Number(row.vehicle_capacity || 0),
        registrationNumber: row.vehicle_registration_number,
      };
    }

    const ride: BookingRideSummary = {
      id: row.ride_id,
      driverId: row.ride_driver_id || '',
      origin: row.ride_origin,
      destination: row.ride_destination,
      pickupPoint: row.ride_pickup_point || null,
      dropoffPoint: row.ride_dropoff_point || null,
      departureTime: row.ride_departure_time ? new Date(row.ride_departure_time).toISOString() : '',
      type: row.ride_type || 'INTERCITY',
      status: row.ride_status || 'SCHEDULED',
      pricePerSeat: Number(row.ride_price_per_seat || 0),
      availableSeats: Number(row.ride_available_seats || 0),
      totalSeats: Number(row.ride_total_seats || 0),
      driver,
      vehicle,
    };
    booking.ride = ride;
  }

  return booking;
}

const BOOKING_SELECT_SQL = `
  SELECT 
    b.id, b.ride_id, b.passenger_id, b.seats_booked, b.price_per_seat, b.total_price, b.status,
    b.created_at, b.updated_at,
    u.name AS passenger_name, u.bio AS passenger_bio, (u.is_email_verified OR u.is_phone_verified) AS passenger_verified, u.created_at AS passenger_created_at,
    r.origin AS ride_origin, r.destination AS ride_destination, r.pickup_point AS ride_pickup_point,
    r.dropoff_point AS ride_dropoff_point, r.departure_time AS ride_departure_time, r.type AS ride_type,
    r.status AS ride_status, r.price_per_seat AS ride_price_per_seat, r.available_seats AS ride_available_seats,
    r.total_seats AS ride_total_seats, r.driver_id AS ride_driver_id,
    d.name AS driver_name, d.bio AS driver_bio, (d.is_email_verified OR d.is_phone_verified) AS driver_verified, d.created_at AS driver_created_at,
    v.id AS vehicle_id, v.type AS vehicle_type, v.make AS vehicle_make, v.model AS vehicle_model,
    v.year AS vehicle_year, v.color AS vehicle_color, v.capacity AS vehicle_capacity,
    v.registration_number AS vehicle_registration_number
  FROM bookings b
  JOIN users u ON b.passenger_id = u.id
  JOIN rides r ON b.ride_id = r.id
  JOIN users d ON r.driver_id = d.id
  JOIN vehicles v ON r.vehicle_id = v.id
`;

export class BookingRepository {
  /**
   * Request a booking as a passenger
   */
  async createBooking(passengerId: string, rideId: string, seatsBooked: number): Promise<Booking> {
    if (!seatsBooked || seatsBooked < 1) {
      throw new BookingRepositoryError('You must request at least 1 seat.', 400);
    }

    return withTransaction(async (conn) => {
      // 1. Fetch and inspect ride with row lock
      const [rideRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, driver_id, departure_time, total_seats, available_seats, price_per_seat, status 
         FROM rides WHERE id = ? FOR UPDATE;`,
        [rideId],
      );

      if (rideRows.length === 0) {
        throw new BookingRepositoryError('Ride not found.', 404);
      }

      const ride = rideRows[0];

      // 2. Prevent booking own ride
      if (ride.driver_id === passengerId) {
        throw new BookingRepositoryError('You cannot book a seat on your own offered ride.', 400);
      }

      // 3. Status and schedule checks
      if (ride.status !== 'SCHEDULED') {
        throw new BookingRepositoryError(
          `Cannot book ride: ride is ${ride.status.toLowerCase()}.`,
          400,
        );
      }

      const departureTime = new Date(ride.departure_time);
      if (departureTime.getTime() <= Date.now()) {
        throw new BookingRepositoryError(
          'Cannot book ride: departure time has already passed.',
          400,
        );
      }

      // 4. Capacity checks
      if (seatsBooked > Number(ride.available_seats)) {
        throw new BookingRepositoryError(
          `Requested ${seatsBooked} seats, but only ${ride.available_seats} seat(s) are currently available.`,
          409,
          'INSUFFICIENT_SEATS',
        );
      }

      // 5. Prevent duplicate active booking by same passenger on same ride
      const [existingRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, status FROM bookings 
         WHERE ride_id = ? AND passenger_id = ? AND status IN ('PENDING', 'CONFIRMED')
         LIMIT 1;`,
        [rideId, passengerId],
      );

      if (existingRows.length > 0) {
        throw new BookingRepositoryError(
          'You already have an active booking request for this ride.',
          409,
          'DUPLICATE_ACTIVE_BOOKING',
        );
      }

      // 6. Calculate server-authoritative price snapshot
      const pricePerSeat = Number(ride.price_per_seat);
      const totalPrice = pricePerSeat * seatsBooked;
      const bookingId = crypto.randomUUID();

      // 7. Insert booking in PENDING status (seats are held upon driver confirmation)
      await conn.query(
        `INSERT INTO bookings (id, ride_id, passenger_id, seats_booked, price_per_seat, total_price, status)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING');`,
        [bookingId, rideId, passengerId, seatsBooked, pricePerSeat, totalPrice],
      );

      // 8. Fetch complete created booking
      const [createdRows] = await conn.query<BookingRow[]>(
        `${BOOKING_SELECT_SQL} WHERE b.id = ?;`,
        [bookingId],
      );

      return mapRowToBooking(createdRows[0]);
    });
  }

  /**
   * Driver confirms a pending booking request (concurrency critical)
   */
  async confirmBooking(bookingId: string, driverId: string): Promise<Booking> {
    return withTransaction(async (conn) => {
      // 1. Lock and fetch booking
      const [bookingRows] = await conn.query<BookingRow[]>(
        `SELECT id, ride_id, passenger_id, seats_booked, status 
         FROM bookings WHERE id = ? FOR UPDATE;`,
        [bookingId],
      );

      if (bookingRows.length === 0) {
        throw new BookingRepositoryError('Booking not found.', 404);
      }

      const booking = bookingRows[0];

      if (booking.status !== 'PENDING') {
        throw new BookingRepositoryError(
          `Cannot confirm booking: current status is ${booking.status}.`,
          400,
        );
      }

      // 2. Lock and fetch ride
      const [rideRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, driver_id, total_seats, available_seats, status 
         FROM rides WHERE id = ? FOR UPDATE;`,
        [booking.ride_id],
      );

      if (rideRows.length === 0) {
        throw new BookingRepositoryError('Associated ride not found.', 404);
      }

      const ride = rideRows[0];

      if (ride.driver_id !== driverId) {
        throw new BookingRepositoryError(
          'You are not authorized to confirm bookings for this ride.',
          403,
        );
      }

      if (ride.status !== 'SCHEDULED') {
        throw new BookingRepositoryError(
          `Cannot confirm booking: ride is currently ${ride.status.toLowerCase()}.`,
          400,
        );
      }

      // 3. Strict Capacity Validation under Row Lock (prevents race condition / overbooking)
      const seatsToHold = Number(booking.seats_booked);
      const currentAvailable = Number(ride.available_seats);

      if (currentAvailable < seatsToHold) {
        throw new BookingRepositoryError(
          `Cannot confirm booking: only ${currentAvailable} seat(s) remaining, but booking requires ${seatsToHold}.`,
          409,
          'INSUFFICIENT_SEATS',
        );
      }

      // 4. Decrement available seats atomically
      await conn.query(`UPDATE rides SET available_seats = available_seats - ? WHERE id = ?;`, [
        seatsToHold,
        ride.id,
      ]);

      // 5. Update booking status to CONFIRMED
      await conn.query(`UPDATE bookings SET status = 'CONFIRMED' WHERE id = ?;`, [bookingId]);

      // 6. Return fully populated booking
      const [updatedRows] = await conn.query<BookingRow[]>(
        `${BOOKING_SELECT_SQL} WHERE b.id = ?;`,
        [bookingId],
      );

      return mapRowToBooking(updatedRows[0]);
    });
  }

  /**
   * Driver rejects a pending booking request
   */
  async rejectBooking(bookingId: string, driverId: string): Promise<Booking> {
    return withTransaction(async (conn) => {
      // 1. Lock booking
      const [bookingRows] = await conn.query<BookingRow[]>(
        `SELECT id, ride_id, status FROM bookings WHERE id = ? FOR UPDATE;`,
        [bookingId],
      );

      if (bookingRows.length === 0) {
        throw new BookingRepositoryError('Booking not found.', 404);
      }

      const booking = bookingRows[0];

      if (booking.status !== 'PENDING') {
        throw new BookingRepositoryError(
          `Cannot reject booking: current status is ${booking.status}. Only PENDING bookings can be rejected.`,
          400,
        );
      }

      // 2. Lock ride and verify driver ownership
      const [rideRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, driver_id FROM rides WHERE id = ? FOR UPDATE;`,
        [booking.ride_id],
      );

      if (rideRows.length === 0 || rideRows[0].driver_id !== driverId) {
        throw new BookingRepositoryError(
          'You are not authorized to manage bookings for this ride.',
          403,
        );
      }

      // 3. Transition to REJECTED (no seats were held, so none released)
      await conn.query(`UPDATE bookings SET status = 'REJECTED' WHERE id = ?;`, [bookingId]);

      const [updatedRows] = await conn.query<BookingRow[]>(
        `${BOOKING_SELECT_SQL} WHERE b.id = ?;`,
        [bookingId],
      );

      return mapRowToBooking(updatedRows[0]);
    });
  }

  /**
   * Passenger or Driver cancels a booking
   * If CONFIRMED, released seats are restored back to the ride exactly once
   */
  async cancelBooking(bookingId: string, userId: string): Promise<Booking> {
    return withTransaction(async (conn) => {
      // 1. Lock booking
      const [bookingRows] = await conn.query<BookingRow[]>(
        `SELECT id, ride_id, passenger_id, seats_booked, status 
         FROM bookings WHERE id = ? FOR UPDATE;`,
        [bookingId],
      );

      if (bookingRows.length === 0) {
        throw new BookingRepositoryError('Booking not found.', 404);
      }

      const booking = bookingRows[0];

      if (booking.status === 'CANCELLED') {
        throw new BookingRepositoryError('This booking is already cancelled.', 400);
      }
      if (booking.status === 'REJECTED') {
        throw new BookingRepositoryError('Cannot cancel a rejected booking.', 400);
      }
      if (booking.status === 'COMPLETED') {
        throw new BookingRepositoryError('Cannot cancel an already completed booking.', 400);
      }

      // 2. Lock ride to check authorization
      const [rideRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, driver_id, total_seats, available_seats FROM rides WHERE id = ? FOR UPDATE;`,
        [booking.ride_id],
      );

      if (rideRows.length === 0) {
        throw new BookingRepositoryError('Associated ride not found.', 404);
      }

      const ride = rideRows[0];
      const isPassenger = booking.passenger_id === userId;
      const isDriver = ride.driver_id === userId;

      if (!isPassenger && !isDriver) {
        throw new BookingRepositoryError('You are not authorized to cancel this booking.', 403);
      }

      // 3. If CONFIRMED, restore available seats to the ride
      if (booking.status === 'CONFIRMED') {
        const seatsToRelease = Number(booking.seats_booked);
        await conn.query(
          `UPDATE rides 
           SET available_seats = LEAST(total_seats, available_seats + ?) 
           WHERE id = ?;`,
          [seatsToRelease, ride.id],
        );
      }

      // 4. Update status to CANCELLED
      await conn.query(`UPDATE bookings SET status = 'CANCELLED' WHERE id = ?;`, [bookingId]);

      const [updatedRows] = await conn.query<BookingRow[]>(
        `${BOOKING_SELECT_SQL} WHERE b.id = ?;`,
        [bookingId],
      );

      return mapRowToBooking(updatedRows[0]);
    });
  }

  /**
   * Find booking by ID (accessible by passenger or driver)
   */
  async findBookingById(bookingId: string): Promise<Booking | null> {
    const rows = await query<BookingRow[]>(`${BOOKING_SELECT_SQL} WHERE b.id = ?;`, [bookingId]);

    if (rows.length === 0) return null;
    return mapRowToBooking(rows[0]);
  }

  /**
   * Find all bookings for a passenger
   */
  async findPassengerBookings(passengerId: string, status?: BookingStatus): Promise<Booking[]> {
    let sql = `${BOOKING_SELECT_SQL} WHERE b.passenger_id = ?`;
    const params: unknown[] = [passengerId];

    if (status) {
      sql += ' AND b.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY b.created_at DESC;';

    const rows = await query<BookingRow[]>(sql, params);
    return rows.map(mapRowToBooking);
  }

  /**
   * Find all bookings for a driver across all their offered rides
   */
  async findDriverBookings(
    driverId: string,
    rideId?: string,
    status?: BookingStatus,
  ): Promise<Booking[]> {
    let sql = `${BOOKING_SELECT_SQL} WHERE r.driver_id = ?`;
    const params: unknown[] = [driverId];

    if (rideId) {
      sql += ' AND b.ride_id = ?';
      params.push(rideId);
    }

    if (status) {
      sql += ' AND b.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY b.created_at DESC;';

    const rows = await query<BookingRow[]>(sql, params);
    return rows.map(mapRowToBooking);
  }

  /**
   * Find bookings for a specific ride (verifying driver ownership)
   */
  async findRideBookings(rideId: string, driverId: string): Promise<Booking[]> {
    const rideRows = await query<RowDataPacket[]>(
      'SELECT id, driver_id FROM rides WHERE id = ?;',
      [rideId],
    );

    if (rideRows.length === 0) {
      throw new BookingRepositoryError('Ride not found.', 404, 'NOT_FOUND');
    }

    if (rideRows[0].driver_id !== driverId) {
      throw new BookingRepositoryError(
        'You are not authorized to view bookings for this ride.',
        403,
        'FORBIDDEN',
      );
    }

    const sql = `
      ${BOOKING_SELECT_SQL} 
      WHERE b.ride_id = ? AND r.driver_id = ?
      ORDER BY b.created_at DESC;
    `;
    const rows = await query<BookingRow[]>(sql, [rideId, driverId]);
    return rows.map(mapRowToBooking);
  }
}

export const bookingRepository = new BookingRepository();
