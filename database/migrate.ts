import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const migrationEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z
    .string()
    .default('3307')
    .transform((val) => parseInt(val, 10))
    .refine((port) => !isNaN(port) && port > 0 && port < 65536, {
      message: 'DB_PORT must be a valid number between 1 and 65535',
    }),
  DB_USER: z.string().default('ridemitra_user'),
  DB_PASSWORD: z.string().default('ridemitra_dev_password'),
  DB_NAME: z.string().default('ridemitra_dev'),
  DB_SSL: z
    .enum(['true', 'false', '1', '0'])
    .default('false')
    .transform((val) => val === 'true' || val === '1'),
  DB_AUTO_CREATE: z
    .enum(['true', 'false', '1', '0'])
    .default('false')
    .transform((val) => val === 'true' || val === '1'),
  DB_CA_PATH: z.string().optional(),
});

export type MigrationEnv = z.infer<typeof migrationEnvSchema>;

export function parseMigrationEnv(
  env: Record<string, string | undefined> = process.env,
): MigrationEnv {
  const parsed = migrationEnvSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid migration configuration:\n${issues}`);
  }
  return parsed.data;
}

export function isAutoCreateAllowed(nodeEnv: string, autoCreateRequested: boolean): boolean {
  return nodeEnv === 'development' && autoCreateRequested;
}

export function isResetAllowed(nodeEnv: string): boolean {
  return nodeEnv !== 'production';
}

export function buildMigrationSslOptions(
  isSsl: boolean,
  caPath?: string,
): mysql.SslOptions | undefined {
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
    verifyIdentity: true,
    ...(caContent ? { ca: caContent } : {}),
  };
}

export function sanitizeDbError(err: unknown): { code: string; message: string } {
  const error = err as { code?: string; errno?: number; message?: string };
  const code = error.code || 'DB_ERROR';

  if (code === 'ER_ACCESS_DENIED_ERROR') {
    return { code, message: 'Access denied for the specified database user. Verify credentials.' };
  }
  if (code === 'ECONNREFUSED') {
    return {
      code,
      message: 'Connection refused. Ensure the database server is running and reachable.',
    };
  }
  if (code === 'ER_BAD_DB_ERROR') {
    return { code, message: 'Database does not exist on the target server.' };
  }
  if (code === 'ENOTFOUND') {
    return { code, message: 'Database host not found. Verify DB_HOST value.' };
  }
  if (code === 'ETIMEDOUT') {
    return { code, message: 'Connection timed out connecting to the database server.' };
  }
  if (
    code.includes('CERT_') ||
    code.includes('HANDSHAKE') ||
    code.includes('SSL') ||
    code.includes('UNABLE_TO_VERIFY')
  ) {
    return {
      code,
      message:
        'TLS/SSL handshake or certificate verification failed. Never falling back to insecure plaintext.',
    };
  }

  // Generic sanitized fallback: mask any potential passwords or connection URIs
  const rawMsg = error.message || 'Database error occurred';
  const safeMsg = rawMsg
    .replace(/(password=)[^&; ]+/gi, '$1[REDACTED]')
    .replace(/:([^@/:]+)@/g, ':[REDACTED]@');

  return { code, message: safeMsg };
}

export async function migrateDatabase(
  envConfig: MigrationEnv = parseMigrationEnv(),
  args: string[] = process.argv,
): Promise<void> {
  const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_SSL,
    DB_AUTO_CREATE,
    DB_CA_PATH,
    NODE_ENV,
  } = envConfig;
  const sslOptions = buildMigrationSslOptions(DB_SSL, DB_CA_PATH);

  console.log(
    `🔌 Connecting to database '${DB_NAME}' at ${DB_HOST}:${DB_PORT} (TLS: ${DB_SSL}, Env: ${NODE_ENV})...`,
  );

  let connection: mysql.Connection | null = null;
  try {
    // 1. Primary Path: Connect directly to the target database
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: true,
      ssl: sslOptions,
    });
  } catch (err: unknown) {
    const mysqlError = err as { code?: string };

    // 2. Handle missing database safely
    if (mysqlError.code === 'ER_BAD_DB_ERROR') {
      if (!isAutoCreateAllowed(NODE_ENV, DB_AUTO_CREATE)) {
        throw new Error(
          `Database '${DB_NAME}' does not exist and automatic creation is disabled for NODE_ENV='${NODE_ENV}'. ` +
            `Please create the database on your target instance before running migrations.`,
        );
      }

      console.log(`ℹ️  Local development auto-create active. Initializing '${DB_NAME}'...`);
      let adminConn: mysql.Connection | null = null;
      try {
        adminConn = await mysql.createConnection({
          host: DB_HOST,
          port: DB_PORT,
          user: DB_USER,
          password: DB_PASSWORD,
          ssl: sslOptions,
        });
        await adminConn.query(
          `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
        );
        console.log(`✅ Database '${DB_NAME}' initialized successfully.`);
      } finally {
        if (adminConn) {
          await adminConn.end();
        }
      }

      // Connect to the newly created database
      connection = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        multipleStatements: true,
        ssl: sslOptions,
      });
    } else {
      // Re-throw for outer controlled handler without silent plaintext fallback
      throw err;
    }
  }

  try {
    // If --reset flag provided, drop all tables
    if (args.includes('--reset')) {
      if (!isResetAllowed(NODE_ENV)) {
        throw new Error(
          `Destructive operation '--reset' is strictly prohibited in production (NODE_ENV='${NODE_ENV}').`,
        );
      }
      console.log('⚠️  Reset flag detected. Dropping existing tables...');
      await connection.query('DROP TABLE IF EXISTS bookings;');
      await connection.query('DROP TABLE IF EXISTS rides;');
      await connection.query('DROP TABLE IF EXISTS vehicles;');
      await connection.query('DROP TABLE IF EXISTS sessions;');
      await connection.query('DROP TABLE IF EXISTS users;');
      await connection.query('DROP TABLE IF EXISTS schema_migrations;');
      console.log('🧹 Cleaned database tables.');
    }

    // Ensure schema_migrations table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Fetch already applied migrations
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT name FROM schema_migrations ORDER BY name ASC;',
    );
    const appliedSet = new Set(rows.map((r) => r.name as string));

    const migrationsDir = path.resolve(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`📂 Found ${files.length} migration file(s) in ${migrationsDir}`);

    let appliedCount = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏩ [Skipped] Already applied: ${file}`);
        continue;
      }

      console.log(`⏳ [Applying] ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      await connection.query(sql);
      await connection.query('INSERT INTO schema_migrations (name) VALUES (?);', [file]);
      console.log(`✅ [Applied] ${file}`);
      appliedCount++;
    }

    console.log(`\n🎉 Migration complete. ${appliedCount} new migration(s) applied successfully.`);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Execute only when run directly as CLI script
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  migrateDatabase().catch((err) => {
    const sanitized = sanitizeDbError(err);
    console.error(`❌ Migration failed [${sanitized.code}]: ${sanitized.message}`);
    process.exit(1);
  });
}
