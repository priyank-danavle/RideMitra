import mysql from 'mysql2/promise';
import { config } from '../config/index.js';

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
      console.error('Database connection test failed:', error);
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
