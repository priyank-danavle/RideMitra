import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { envSchema } from '../src/config/index.js';
import { buildSslOptions } from '../src/db/index.js';
import {
  parseMigrationEnv,
  isAutoCreateAllowed,
  buildMigrationSslOptions,
  sanitizeDbError,
} from '../../database/migrate.js';

describe('RideMitra Database TLS & Safety Verification (Phase 5.5C)', () => {
  describe('1. DB_SSL Schema Parsing (API & Migration Consistency)', () => {
    it('should default DB_SSL to false when unset in both API and migration runner', () => {
      const apiResult = envSchema.safeParse({});
      expect(apiResult.success).toBe(true);
      if (apiResult.success) {
        expect(apiResult.data.DB_SSL).toBe(false);
      }

      const migResult = parseMigrationEnv({});
      expect(migResult.DB_SSL).toBe(false);
    });

    it('should parse DB_SSL="true" or "1" as boolean true in both configurations', () => {
      for (const val of ['true', '1']) {
        const apiResult = envSchema.safeParse({ DB_SSL: val });
        expect(apiResult.success).toBe(true);
        if (apiResult.success) {
          expect(apiResult.data.DB_SSL).toBe(true);
        }

        const migResult = parseMigrationEnv({ DB_SSL: val });
        expect(migResult.DB_SSL).toBe(true);
      }
    });

    it('should parse DB_SSL="false" or "0" as boolean false in both configurations', () => {
      for (const val of ['false', '0']) {
        const apiResult = envSchema.safeParse({ DB_SSL: val });
        expect(apiResult.success).toBe(true);
        if (apiResult.success) {
          expect(apiResult.data.DB_SSL).toBe(false);
        }

        const migResult = parseMigrationEnv({ DB_SSL: val });
        expect(migResult.DB_SSL).toBe(false);
      }
    });

    it('should fail fast with schema validation errors on invalid DB_SSL values', () => {
      const invalidValues = ['insecure', 'yes', 'enabled', 'random', 'true_typo', 'none'];
      for (const val of invalidValues) {
        const apiResult = envSchema.safeParse({ DB_SSL: val });
        expect(apiResult.success).toBe(false);

        expect(() => parseMigrationEnv({ DB_SSL: val })).toThrow(/Invalid migration configuration/);
      }
    });
  });

  describe('2. DB_AUTO_CREATE Schema Parsing', () => {
    it('should default DB_AUTO_CREATE to false when unset', () => {
      const apiResult = envSchema.safeParse({});
      expect(apiResult.success).toBe(true);
      if (apiResult.success) {
        expect(apiResult.data.DB_AUTO_CREATE).toBe(false);
      }

      const migResult = parseMigrationEnv({});
      expect(migResult.DB_AUTO_CREATE).toBe(false);
    });

    it('should parse DB_AUTO_CREATE="true" and "1" as boolean true', () => {
      for (const val of ['true', '1']) {
        const apiResult = envSchema.safeParse({ DB_AUTO_CREATE: val });
        expect(apiResult.success).toBe(true);
        if (apiResult.success) {
          expect(apiResult.data.DB_AUTO_CREATE).toBe(true);
        }

        const migResult = parseMigrationEnv({ DB_AUTO_CREATE: val });
        expect(migResult.DB_AUTO_CREATE).toBe(true);
      }
    });

    it('should fail fast on invalid DB_AUTO_CREATE values', () => {
      const invalidValues = ['always', 'yes', 'on', 'invalid'];
      for (const val of invalidValues) {
        const apiResult = envSchema.safeParse({ DB_AUTO_CREATE: val });
        expect(apiResult.success).toBe(false);

        expect(() => parseMigrationEnv({ DB_AUTO_CREATE: val })).toThrow(
          /Invalid migration configuration/,
        );
      }
    });
  });

  describe('3. DB_CA_PATH Validation & Certificate Loading', () => {
    it('should reject DB_CA_PATH if the file does not exist on filesystem', () => {
      const nonExistentPath = path.resolve(__dirname, 'fixtures/non_existent_ca.pem');

      const apiResult = envSchema.safeParse({ DB_CA_PATH: nonExistentPath });
      expect(apiResult.success).toBe(false);

      expect(() => buildSslOptions(true, nonExistentPath)).toThrow(/CA certificate file not found/);
      expect(() => buildMigrationSslOptions(true, nonExistentPath)).toThrow(
        /CA certificate file not found/,
      );
    });

    it('should load CA certificate content without exposing it in logs', () => {
      const dummyCertDir = path.resolve(__dirname, '../src');
      const tempCaFile = path.join(dummyCertDir, '__temp_test_ca.pem');
      const dummyCaContent =
        '-----BEGIN CERTIFICATE-----\nTEST_CERT_DATA\n-----END CERTIFICATE-----';

      try {
        fs.writeFileSync(tempCaFile, dummyCaContent, 'utf-8');

        const poolSsl = buildSslOptions(true, tempCaFile);
        expect(poolSsl?.ca).toBe(dummyCaContent);
        expect(poolSsl?.rejectUnauthorized).toBe(true);
        expect(poolSsl?.minVersion).toBe('TLSv1.2');

        const migSsl = buildMigrationSslOptions(true, tempCaFile);
        expect(migSsl?.ca).toBe(dummyCaContent);
        expect(migSsl?.rejectUnauthorized).toBe(true);
      } finally {
        if (fs.existsSync(tempCaFile)) {
          fs.unlinkSync(tempCaFile);
        }
      }
    });
  });

  describe('4. TLS Invariants & Plaintext Fallback Prevention', () => {
    it('should return undefined when TLS is disabled (plain TCP socket for local Docker on port 3307)', () => {
      expect(buildSslOptions(false)).toBeUndefined();
      expect(buildMigrationSslOptions(false)).toBeUndefined();
    });

    it('should strictly enforce rejectUnauthorized: true and minVersion: TLSv1.2 when TLS is enabled', () => {
      const poolSsl = buildSslOptions(true);
      expect(poolSsl).toEqual({
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      });

      const migSsl = buildMigrationSslOptions(true);
      expect(migSsl).toEqual({
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      });
    });

    it('should never permit rejectUnauthorized: false in any generated options', () => {
      const poolSsl = buildSslOptions(true);
      expect(poolSsl?.rejectUnauthorized).toBe(true);
      expect((poolSsl as Record<string, unknown>).rejectUnauthorized).not.toBe(false);

      const migSsl = buildMigrationSslOptions(true);
      expect(migSsl?.rejectUnauthorized).toBe(true);
      expect((migSsl as Record<string, unknown>).rejectUnauthorized).not.toBe(false);
    });
  });

  describe('5. Database Creation Safety Gate (Production Blocking)', () => {
    it('should strictly forbid auto-creation when NODE_ENV is production even if requested', () => {
      expect(isAutoCreateAllowed('production', true)).toBe(false);
      expect(isAutoCreateAllowed('production', false)).toBe(false);
    });

    it('should strictly forbid auto-creation in test environment', () => {
      expect(isAutoCreateAllowed('test', true)).toBe(false);
      expect(isAutoCreateAllowed('test', false)).toBe(false);
    });

    it('should forbid auto-creation in development when DB_AUTO_CREATE is false', () => {
      expect(isAutoCreateAllowed('development', false)).toBe(false);
    });

    it('should allow auto-creation only in development when DB_AUTO_CREATE is true', () => {
      expect(isAutoCreateAllowed('development', true)).toBe(true);
    });
  });

  describe('6. Error Sanitization & Credential Protection', () => {
    it('should sanitize authentication errors and mask credentials', () => {
      const sanitized = sanitizeDbError({
        code: 'ER_ACCESS_DENIED_ERROR',
        message: 'Access denied for user ridemitra_user@localhost (using password: YES)',
      });
      expect(sanitized.code).toBe('ER_ACCESS_DENIED_ERROR');
      expect(sanitized.message).not.toContain('password: YES');
      expect(sanitized.message).toContain('Access denied for the specified database user');
    });

    it('should sanitize connection refused errors', () => {
      const sanitized = sanitizeDbError({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED 127.0.0.1:3307',
      });
      expect(sanitized.code).toBe('ECONNREFUSED');
      expect(sanitized.message).toContain('Connection refused');
    });

    it('should sanitize missing database errors', () => {
      const sanitized = sanitizeDbError({
        code: 'ER_BAD_DB_ERROR',
        message: "Unknown database 'ridemitra_prod'",
      });
      expect(sanitized.code).toBe('ER_BAD_DB_ERROR');
      expect(sanitized.message).toContain('Database does not exist on the target server');
    });

    it('should sanitize TLS handshake failures and confirm no plaintext retry message', () => {
      const sanitized = sanitizeDbError({
        code: 'HANDSHAKE_ERROR',
        message: 'SSL routines:ssl3_read_bytes:tlsv1 alert certificate expired',
      });
      expect(sanitized.code).toBe('HANDSHAKE_ERROR');
      expect(sanitized.message).toContain('Never falling back to insecure plaintext');
    });

    it('should redact inline passwords from unknown error messages', () => {
      const sanitized = sanitizeDbError({
        code: 'UNKNOWN_ERROR',
        message:
          'Failed connecting to mysql://admin:super_secret_password_123@10.0.0.1:3306/db?password=secret_token_abc',
      });
      expect(sanitized.message).not.toContain('super_secret_password_123');
      expect(sanitized.message).not.toContain('secret_token_abc');
      expect(sanitized.message).toContain('[REDACTED]');
    });
  });
});
