import fs from 'fs';
import mysql from 'mysql2/promise';
import { config } from '../config/index.js';

/**
 * Builds verified SSL/TLS options for mysql2 connection pool
 */
export function buildSslOptions(isSsl: boolean, caPath?: string): mysql.SslOptions | undefined {
  if (!isSsl) {
    return undefined;
  }

  let caContent: string | undefined;
  if (caPath) {
    if (!fs.existsSync(caPath)) {
      throw new Error(`CA certificate file not found at path: ${caPath}`);
    }
    caContent = fs.readFileSync(caPath, 'utf-8');
  }

  return {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
    ...(caContent ? { ca: caContent } : {}),
  };
}

export const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  namedPlaceholders: true,
  ssl: buildSslOptions(config.database.ssl, config.database.caPath),
});

/**
 * Executes a SQL query against the connection pool
 */
export async function query<T extends mysql.RowDataPacket[] | mysql.ResultSetHeader>(
  sql: string,
  params?: unknown[] | Record<string, unknown>,
): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results] = await pool.query<T>(sql, params as any);
  return results;
}

/**
 * Executes a callback within a managed database transaction with automatic commit and rollback
 */
export async function withTransaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Tests database connectivity for health/readiness checks
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    const [rows] = await pool.query('SELECT 1 as healthy;');
    return Array.isArray(rows) && rows.length > 0;
  } catch (error) {
    if (!config.isTest) {
      const err = error as { code?: string; message?: string };
      const safeMessage = (err?.message || 'Database connection error')
        .replace(/(password=)[^&; ]+/gi, '$1[REDACTED]')
        .replace(/:([^@/:]+)@/g, ':[REDACTED]@');
      console.error(`Database connection test failed [${err?.code || 'DB_ERROR'}]:`, safeMessage);
    }
    return false;
  }
}

/**
 * Closes the database pool during server graceful shutdown
 */
export async function closeDbPool(): Promise<void> {
  try {
    await pool.end();
  } catch (error) {
    console.error('Error closing database connection pool:', error);
  }
}
