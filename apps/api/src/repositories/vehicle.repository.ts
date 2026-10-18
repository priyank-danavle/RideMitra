import crypto from 'crypto';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { Vehicle, SpecificVehicleType } from '@ridemitra/shared';
import { query } from '../db/index.js';

export interface VehicleDbRow extends RowDataPacket {
  id: string;
  user_id: string;
  type: SpecificVehicleType;
  make: string;
  model: string;
  year: number;
  color: string;
  registration_number: string;
  capacity: number;
  is_verified: number | boolean;
  is_active: number | boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export function mapVehicleRowToEntity(row: VehicleDbRow): Vehicle {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    make: row.make,
    model: row.model,
    year: row.year,
    color: row.color,
    registrationNumber: row.registration_number,
    capacity: row.capacity,
    isVerified: Boolean(row.is_verified),
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export const vehicleRepository = {
  async createVehicle(data: {
    userId: string;
    type: SpecificVehicleType;
    make: string;
    model: string;
    year: number;
    color: string;
    registrationNumber: string;
    capacity: number;
  }): Promise<Vehicle> {
    const id = crypto.randomUUID();
    const normalizedReg = data.registrationNumber.trim().toUpperCase();

    await query<ResultSetHeader>(
      `INSERT INTO vehicles (id, user_id, type, make, model, year, color, registration_number, capacity, is_verified, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, TRUE);`,
      [
        id,
        data.userId,
        data.type,
        data.make.trim(),
        data.model.trim(),
        data.year,
        data.color.trim(),
        normalizedReg,
        data.capacity,
      ],
    );

    const vehicle = await vehicleRepository.findVehicleById(id, data.userId);
    if (!vehicle) {
      throw new Error('Failed to retrieve newly created vehicle');
    }
    return vehicle;
  },

  async findVehiclesByUserId(userId: string): Promise<Vehicle[]> {
    const rows = await query<VehicleDbRow[]>(
      `SELECT id, user_id, type, make, model, year, color, registration_number, capacity, is_verified, is_active, created_at, updated_at
       FROM vehicles
       WHERE user_id = ? AND is_active = TRUE
       ORDER BY created_at DESC;`,
      [userId],
    );

    return rows.map(mapVehicleRowToEntity);
  },

  async findVehicleById(
    id: string,
    userId: string,
    includeInactive: boolean = false,
  ): Promise<Vehicle | null> {
    const activeClause = includeInactive ? '' : ' AND is_active = TRUE';
    const rows = await query<VehicleDbRow[]>(
      `SELECT id, user_id, type, make, model, year, color, registration_number, capacity, is_verified, is_active, created_at, updated_at
       FROM vehicles
       WHERE id = ? AND user_id = ?${activeClause};`,
      [id, userId],
    );

    return rows.length > 0 ? mapVehicleRowToEntity(rows[0]) : null;
  },

  async updateVehicle(
    id: string,
    userId: string,
    updates: Partial<{
      make: string;
      model: string;
      year: number;
      color: string;
      capacity: number;
    }>,
  ): Promise<Vehicle | null> {
    const existing = await vehicleRepository.findVehicleById(id, userId);
    if (!existing) {
      return null;
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.make !== undefined) {
      fields.push('make = ?');
      values.push(updates.make.trim());
    }
    if (updates.model !== undefined) {
      fields.push('model = ?');
      values.push(updates.model.trim());
    }
    if (updates.year !== undefined) {
      fields.push('year = ?');
      values.push(updates.year);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color.trim());
    }
    if (updates.capacity !== undefined) {
      fields.push('capacity = ?');
      values.push(updates.capacity);
    }

    if (fields.length > 0) {
      values.push(id, userId);
      await query<ResultSetHeader>(
        `UPDATE vehicles SET ${fields.join(', ')} WHERE id = ? AND user_id = ?;`,
        values,
      );
    }

    return vehicleRepository.findVehicleById(id, userId);
  },

  async deactivateVehicle(id: string, userId: string): Promise<boolean> {
    const result = await query<ResultSetHeader>(
      'UPDATE vehicles SET is_active = FALSE WHERE id = ? AND user_id = ? AND is_active = TRUE;',
      [id, userId],
    );

    return result.affectedRows > 0;
  },
};
