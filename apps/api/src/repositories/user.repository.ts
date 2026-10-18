import crypto from 'crypto';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { UserSafeProfile, UserRole } from '@ridemitra/shared';
import { query } from '../db/index.js';

export interface UserDbRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  bio: string | null;
  role: UserRole;
  is_email_verified: number | boolean;
  is_phone_verified: number | boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export function mapUserRowToSafeProfile(row: UserDbRow): UserSafeProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    bio: row.bio,
    role: row.role,
    isEmailVerified: Boolean(row.is_email_verified),
    isPhoneVerified: Boolean(row.is_phone_verified),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export const userRepository = {
  async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<UserSafeProfile> {
    const id = crypto.randomUUID();
    const normalizedEmail = data.email.trim().toLowerCase();

    await query<ResultSetHeader>(
      `INSERT INTO users (id, name, email, password_hash)
       VALUES (?, ?, ?, ?);`,
      [id, data.name.trim(), normalizedEmail, data.passwordHash],
    );

    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('Failed to retrieve newly created user');
    }
    return user;
  },

  async findByEmail(email: string): Promise<UserDbRow | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const rows = await query<UserDbRow[]>(
      `SELECT id, name, email, password_hash, phone, bio, role, is_email_verified, is_phone_verified, created_at, updated_at
       FROM users
       WHERE email = ?;`,
      [normalizedEmail],
    );

    return rows.length > 0 ? rows[0] : null;
  },

  async findById(id: string): Promise<UserSafeProfile | null> {
    const rows = await query<UserDbRow[]>(
      `SELECT id, name, email, password_hash, phone, bio, role, is_email_verified, is_phone_verified, created_at, updated_at
       FROM users
       WHERE id = ?;`,
      [id],
    );

    return rows.length > 0 ? mapUserRowToSafeProfile(rows[0]) : null;
  },

  async updateProfile(
    id: string,
    updates: { name?: string; phone?: string | null; bio?: string | null },
  ): Promise<UserSafeProfile> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name.trim());
    }
    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      values.push(updates.phone ? updates.phone.trim() : null);
    }
    if (updates.bio !== undefined) {
      fields.push('bio = ?');
      values.push(updates.bio ? updates.bio.trim() : null);
    }

    if (fields.length > 0) {
      values.push(id);
      await query<ResultSetHeader>(`UPDATE users SET ${fields.join(', ')} WHERE id = ?;`, values);
    }

    const updatedUser = await userRepository.findById(id);
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    return updatedUser;
  },
};
