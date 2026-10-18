import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3307', 10),
  user: process.env.DB_USER || 'ridemitra_user',
  password: process.env.DB_PASSWORD || 'ridemitra_dev_password',
  database: process.env.DB_NAME || 'ridemitra_dev',
};

async function runMigrations() {
  console.log(`🔌 Connecting to MySQL server at ${config.host}:${config.port}...`);

  // First connect without database selected to ensure database exists
  let initialConnection: mysql.Connection | null = null;
  try {
    initialConnection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
    });

    await initialConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    );
    console.log(`✅ Database '${config.database}' verified or created.`);
  } catch (err) {
    console.error('❌ Failed to connect to MySQL:', err);
    process.exit(1);
  } finally {
    if (initialConnection) {
      await initialConnection.end();
    }
  }

  // Connect to target database
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    multipleStatements: true,
  });

  try {
    // If --reset flag provided, drop all tables
    if (process.argv.includes('--reset')) {
      console.log('⚠️  Reset flag detected. Dropping existing tables...');
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
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigrations();
