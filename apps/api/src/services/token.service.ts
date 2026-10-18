import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { query } from '../db/index.js';
import type { RowDataPacket } from 'mysql2';

interface JwtPayload {
  userId: string;
  sessionId: string;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Creates a new authenticated session in MySQL and returns the signed JWT token
 */
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string,
): Promise<{ token: string; expiresAt: Date; sessionId: string }> {
  const sessionId = crypto.randomUUID();
  const token = jwt.sign({ userId, sessionId }, config.auth.jwtSecret, {
    expiresIn: config.auth.expiresIn,
  } as jwt.SignOptions);

  // Default: 7 days expiration
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const tokenHashed = hashToken(token);

  await query(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [sessionId, userId, tokenHashed, expiresAt, userAgent || null, ipAddress || null],
  );

  return { token, expiresAt, sessionId };
}

/**
 * Validates a token against its signature and the persistent sessions table
 */
export async function validateSession(token: string): Promise<JwtPayload | null> {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
    if (!decoded || !decoded.userId || !decoded.sessionId) {
      return null;
    }

    const tokenHashed = hashToken(token);
    const rows = await query<RowDataPacket[]>(
      `SELECT id, user_id, expires_at, revoked_at
       FROM sessions
       WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW();`,
      [tokenHashed],
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Revokes a session upon logout
 */
export async function revokeSession(token: string): Promise<void> {
  const tokenHashed = hashToken(token);
  await query('UPDATE sessions SET revoked_at = NOW() WHERE token_hash = ?;', [tokenHashed]);
}

/**
 * Revokes all active sessions for a user (e.g. password change / security reset)
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await query('UPDATE sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL;', [
    userId,
  ]);
}
