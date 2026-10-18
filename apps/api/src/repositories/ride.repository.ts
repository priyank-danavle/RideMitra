import crypto from 'crypto';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type {
  Ride,
  RideSearchParams,
  CreateRideRequest,
  UpdateRideRequest,
  PaginatedResponse,
  RideStatus,
  SpecificVehicleType,
} from '@ridemitra/shared';
import { query } from '../db/index.js';

interface RideRow extends RowDataPacket {
  id: string;
  driver_id: string;
  vehicle_id: string;
  type: 'CITY' | 'INTERCITY';
  origin: string;
  destination: string;
  pickup_point: string | null;
  dropoff_point: string | null;
  departure_time: Date | string;
  total_seats: number;
  available_seats: number;
  price_per_seat: string | number;
  description: string | null;
  status: RideStatus;
  created_at: Date | string;
  updated_at: Date | string;
  // Joined driver fields
  driver_name?: string;
  driver_bio?: string | null;
  driver_verified?: number | boolean;
  driver_created_at?: Date | string;
  // Joined vehicle fields
  vehicle_type?: SpecificVehicleType;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  vehicle_capacity?: number;
  vehicle_registration_number?: string;
}

function formatDateForMysql(dateInput: string | Date): string {
  const d = new Date(dateInput);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function mapRowToRide(row: RideRow): Ride {
  const ride: Ride = {
    id: row.id,
    driverId: row.driver_id,
    vehicleId: row.vehicle_id,
    type: row.type,
    origin: row.origin,
    destination: row.destination,
    pickupPoint: row.pickup_point,
    dropoffPoint: row.dropoff_point,
    departureTime: new Date(row.departure_time).toISOString(),
    totalSeats: Number(row.total_seats),
    availableSeats: Number(row.available_seats),
    pricePerSeat: Number(row.price_per_seat),
    description: row.description,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };

  if (row.driver_name) {
    ride.driver = {
      id: row.driver_id,
      name: row.driver_name,
      bio: row.driver_bio || null,
      isVerified: Boolean(row.driver_verified),
      createdAt: row.driver_created_at ? new Date(row.driver_created_at).toISOString() : '',
    };
  }

  if (row.vehicle_make && row.vehicle_type) {
    ride.vehicle = {
      id: row.vehicle_id,
      type: row.vehicle_type,
      make: row.vehicle_make,
      model: row.vehicle_model || '',
      year: Number(row.vehicle_year || 0),
      color: row.vehicle_color || '',
      capacity: Number(row.vehicle_capacity || 0),
      registrationNumber: row.vehicle_registration_number,
    };
  }

  return ride;
}

const RIDE_SELECT_JOIN = `
  SELECT 
    r.*,
    u.name AS driver_name,
    u.bio AS driver_bio,
    (u.is_email_verified OR u.is_phone_verified) AS driver_verified,
    u.created_at AS driver_created_at,
    v.type AS vehicle_type,
    v.make AS vehicle_make,
    v.model AS vehicle_model,
    v.year AS vehicle_year,
    v.color AS vehicle_color,
    v.capacity AS vehicle_capacity,
    v.registration_number AS vehicle_registration_number
  FROM rides r
  INNER JOIN users u ON r.driver_id = u.id
  INNER JOIN vehicles v ON r.vehicle_id = v.id
`;

export const rideRepository = {
  /**
   * Publishes a new ride offer after vehicle ownership and capacity checks
   */
  async createRide(driverId: string, data: CreateRideRequest): Promise<Ride> {
    const id = crypto.randomUUID();
    const formattedDeparture = formatDateForMysql(data.departureTime);
    const price = data.pricePerSeat !== undefined ? data.pricePerSeat : 0;

    await query<ResultSetHeader>(
      `INSERT INTO rides (
        id, driver_id, vehicle_id, type, origin, destination,
        pickup_point, dropoff_point, departure_time,
        total_seats, available_seats, price_per_seat, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED');`,
      [
        id,
        driverId,
        data.vehicleId,
        data.type,
        data.origin.trim(),
        data.destination.trim(),
        data.pickupPoint ? data.pickupPoint.trim() : null,
        data.dropoffPoint ? data.dropoffPoint.trim() : null,
        formattedDeparture,
        data.availableSeats,
        data.availableSeats,
        price,
        data.description ? data.description.trim() : null,
      ],
    );

    const created = await this.findRideById(id);
    if (!created) {
      throw new Error('Failed to retrieve newly created ride.');
    }
    return created;
  },

  /**
   * Retrieves single ride by ID with driver public profile and vehicle details
   */
  async findRideById(id: string): Promise<Ride | null> {
    const rows = await query<RideRow[]>(`${RIDE_SELECT_JOIN} WHERE r.id = ? LIMIT 1;`, [id]);
    return rows.length > 0 ? mapRowToRide(rows[0]) : null;
  },

  /**
   * Searches published, upcoming rides matching criteria with database-level pagination
   */
  async searchRides(params: RideSearchParams): Promise<PaginatedResponse<Ride>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [
      "r.status = 'SCHEDULED'",
      'r.departure_time > NOW()',
      'r.available_seats > 0',
    ];
    const values: unknown[] = [];

    if (params.origin) {
      conditions.push('LOWER(r.origin) LIKE LOWER(?)');
      values.push(`%${params.origin.trim()}%`);
    }

    if (params.destination) {
      conditions.push('LOWER(r.destination) LIKE LOWER(?)');
      values.push(`%${params.destination.trim()}%`);
    }

    if (params.date) {
      // Date in format YYYY-MM-DD
      conditions.push('DATE(r.departure_time) = ?');
      values.push(params.date.trim());
    }

    if (params.type) {
      conditions.push('r.type = ?');
      values.push(params.type);
    }

    if (params.vehicleType && params.vehicleType !== 'ALL') {
      conditions.push('v.type = ?');
      values.push(params.vehicleType);
    }

    if (params.minPrice !== undefined && params.minPrice >= 0) {
      conditions.push('r.price_per_seat >= ?');
      values.push(params.minPrice);
    }

    if (params.maxPrice !== undefined && params.maxPrice >= 0) {
      conditions.push('r.price_per_seat <= ?');
      values.push(params.maxPrice);
    }

    if (params.minSeats !== undefined && params.minSeats > 0) {
      conditions.push('r.available_seats >= ?');
      values.push(params.minSeats);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching records for pagination
    const countSql = `
      SELECT COUNT(*) AS total
      FROM rides r
      INNER JOIN vehicles v ON r.vehicle_id = v.id
      ${whereClause};
    `;
    const countRows = await query<RowDataPacket[]>(countSql, values);
    const total = Number(countRows[0]?.total || 0);

    // Sorting
    let orderBy = 'r.departure_time ASC';
    const sortOrder = params.sortOrder === 'desc' ? 'DESC' : 'ASC';
    if (params.sortBy === 'price') {
      orderBy = `r.price_per_seat ${sortOrder}, r.departure_time ASC`;
    } else {
      orderBy = `r.departure_time ${sortOrder}`;
    }

    // Query data page
    const querySql = `
      ${RIDE_SELECT_JOIN}
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?;
    `;
    const queryValues = [...values, limit, offset];
    const rows = await query<RideRow[]>(querySql, queryValues);

    const items = rows.map(mapRowToRide);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  },

  /**
   * Retrieves rides offered by a specific driver, with optional status filter
   */
  async findDriverRides(driverId: string, statusFilter?: RideStatus | 'ALL'): Promise<Ride[]> {
    let sql = `${RIDE_SELECT_JOIN} WHERE r.driver_id = ?`;
    const values: unknown[] = [driverId];

    if (statusFilter && statusFilter !== 'ALL') {
      sql += ' AND r.status = ?';
      values.push(statusFilter);
    }

    sql += ' ORDER BY r.departure_time DESC;';

    const rows = await query<RideRow[]>(sql, values);
    return rows.map(mapRowToRide);
  },

  /**
   * Updates eligible details of a scheduled ride belonging to driver
   */
  async updateRide(id: string, driverId: string, updates: UpdateRideRequest): Promise<Ride | null> {
    const existing = await this.findRideById(id);
    if (!existing || existing.driverId !== driverId) {
      return null;
    }

    // Can only edit if ride is SCHEDULED
    if (existing.status !== 'SCHEDULED') {
      throw new Error(`Cannot update ride in '${existing.status}' status.`);
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.pickupPoint !== undefined) {
      fields.push('pickup_point = ?');
      values.push(updates.pickupPoint ? updates.pickupPoint.trim() : null);
    }
    if (updates.dropoffPoint !== undefined) {
      fields.push('dropoff_point = ?');
      values.push(updates.dropoffPoint ? updates.dropoffPoint.trim() : null);
    }
    if (updates.departureTime !== undefined) {
      fields.push('departure_time = ?');
      values.push(formatDateForMysql(updates.departureTime));
    }
    if (updates.availableSeats !== undefined) {
      fields.push('available_seats = ?');
      values.push(updates.availableSeats);
    }
    if (updates.pricePerSeat !== undefined) {
      fields.push('price_per_seat = ?');
      values.push(updates.pricePerSeat);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description ? updates.description.trim() : null);
    }

    if (fields.length === 0) {
      return existing;
    }

    values.push(id, driverId);
    await query<ResultSetHeader>(
      `UPDATE rides SET ${fields.join(', ')} WHERE id = ? AND driver_id = ?;`,
      values,
    );

    return this.findRideById(id);
  },

  /**
   * Cancels a ride belonging to driver
   */
  async cancelRide(id: string, driverId: string): Promise<boolean> {
    const existing = await this.findRideById(id);
    if (!existing || existing.driverId !== driverId) {
      return false;
    }

    if (existing.status === 'CANCELLED') {
      return true;
    }

    const result = await query<ResultSetHeader>(
      "UPDATE rides SET status = 'CANCELLED' WHERE id = ? AND driver_id = ?;",
      [id, driverId],
    );

    return result.affectedRows > 0;
  },
};
