import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Attempt loading .env from current working dir or monorepo root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('4000')
    .transform((val) => parseInt(val, 10))
    .refine((port) => !isNaN(port) && port > 0 && port < 65536, {
      message: 'PORT must be a valid number between 1 and 65535',
    }),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Database Configuration
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z
    .string()
    .default('3307')
    .transform((val) => parseInt(val, 10))
    .refine((port) => !isNaN(port) && port > 0 && port < 65536, {
      message: 'DB_PORT must be a valid number between 1 and 65535',
    }),
  DB_NAME: z.string().default('ridemitra_dev'),
  DB_USER: z.string().default('ridemitra_user'),
  DB_PASSWORD: z.string().default('ridemitra_dev_password'),
  DB_SSL: z
    .enum(['true', 'false', '1', '0'])
    .default('false')
    .transform((val) => val === 'true' || val === '1'),
  DB_AUTO_CREATE: z
    .enum(['true', 'false', '1', '0'])
    .default('false')
    .transform((val) => val === 'true' || val === '1'),
  DB_CA_PATH: z
    .string()
    .optional()
    .refine((filePath) => !filePath || fs.existsSync(filePath), {
      message: 'DB_CA_PATH file does not exist on filesystem',
    }),

  // Auth Configuration
  AUTH_JWT_SECRET: z
    .string()
    .default('ridemitra_development_jwt_secret_key_at_least_32_characters_long_for_safety'),
  AUTH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  COOKIE_NAME: z.string().default('ridemitra_session'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid application configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

const parsedEnv = parsed.data;

export const config = {
  env: parsedEnv.NODE_ENV,
  isProduction: parsedEnv.NODE_ENV === 'production',
  isTest: parsedEnv.NODE_ENV === 'test',
  port: parsedEnv.PORT,
  apiPrefix: parsedEnv.API_PREFIX,
  corsOrigins: parsedEnv.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  database: {
    host: parsedEnv.DB_HOST,
    port: parsedEnv.DB_PORT,
    database: parsedEnv.DB_NAME,
    user: parsedEnv.DB_USER,
    password: parsedEnv.DB_PASSWORD,
    ssl: parsedEnv.DB_SSL,
    autoCreate: parsedEnv.DB_AUTO_CREATE,
    caPath: parsedEnv.DB_CA_PATH,
  },
  auth: {
    jwtSecret: parsedEnv.AUTH_JWT_SECRET,
    expiresIn: parsedEnv.AUTH_TOKEN_EXPIRES_IN,
    cookieName: parsedEnv.COOKIE_NAME,
  },
  version: '0.1.0',
  serviceName: 'ridemitra-api',
  startTime: Date.now(),
} as const;

export type AppConfig = typeof config;
