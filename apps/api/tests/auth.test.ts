import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { query } from '../src/db/index.js';
import type { RowDataPacket } from 'mysql2';

describe('Phase 2 Authentication & Profile API', () => {
  const testUser = {
    name: 'Aarav Patel',
    email: `aarav.${Date.now()}@example.com`,
    password: 'SecurePassword123!',
  };

  let authToken: string;
  let authCookie: string;
  let createdUserId: string;

  afterAll(async () => {
    // Clean up test user
    if (createdUserId) {
      await query('DELETE FROM users WHERE id = ?;', [createdUserId]);
    }
  });

  it('POST /api/v1/auth/register should successfully register a new user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.name).toBe(testUser.name);
    expect(res.body.data.user.role).toBe('USER');
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).not.toHaveProperty('password_hash');
    expect(res.body.data.token).toBeDefined();

    createdUserId = res.body.data.user.id;
    authToken = res.body.data.token;

    // Verify cookie was set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    authCookie = Array.isArray(cookies) ? cookies[0] : cookies;
    expect(authCookie).toContain('ridemitra_session');
    expect(authCookie).toContain('HttpOnly');
  });

  it('Password must be securely hashed in MySQL and never stored as plaintext', async () => {
    const rows = await query<RowDataPacket[]>('SELECT password_hash FROM users WHERE id = ?;', [
      createdUserId,
    ]);
    expect(rows.length).toBe(1);
    const hash = rows[0].password_hash as string;
    expect(hash).not.toBe(testUser.password);
    expect(hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
  });

  it('POST /api/v1/auth/register should reject duplicate email with 409 Conflict', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('POST /api/v1/auth/register should reject invalid payloads with 400 Bad Request', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'A', // too short
      email: 'not-an-email',
      password: 'short', // too short (< 8 chars)
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/login should fail with 401 on incorrect password with generic message', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword999!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe('Invalid email or password.');
  });

  it('POST /api/v1/auth/login should fail with 401 on non-existent email with same generic message', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nonexistent.user.999@example.com',
      password: 'AnyPassword123!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe('Invalid email or password.');
  });

  it('POST /api/v1/auth/login should succeed with valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.id).toBe(createdUserId);
    expect(res.body.data.token).toBeDefined();

    authToken = res.body.data.token;
  });

  it('GET /api/v1/auth/me should return 401 Unauthorized without authentication', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/auth/me should succeed with Authorization: Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.id).toBe(createdUserId);
    expect(res.body.data.user.name).toBe(testUser.name);
  });

  it('GET /api/v1/users/profile should retrieve current user profile', async () => {
    const res = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(createdUserId);
  });

  it('PATCH /api/v1/users/profile should update permitted fields (name, phone, bio)', async () => {
    const res = await request(app)
      .patch('/api/v1/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Aarav K. Patel',
        phone: '+919876543210',
        bio: 'Daily commuter between Surat Vesu and Adajan.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Aarav K. Patel');
    expect(res.body.data.user.phone).toBe('+919876543210');
    expect(res.body.data.user.bio).toBe('Daily commuter between Surat Vesu and Adajan.');
  });

  it('PATCH /api/v1/users/profile should reject forbidden/privileged fields (mass assignment protection)', async () => {
    const res = await request(app)
      .patch('/api/v1/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Hacker',
        role: 'ADMIN', // Forbidden!
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');

    // Verify role was NOT updated in DB
    const rows = await query<RowDataPacket[]>('SELECT role FROM users WHERE id = ?;', [
      createdUserId,
    ]);
    expect(rows[0].role).toBe('USER');
  });

  it('POST /api/v1/auth/logout should revoke the session and invalidate subsequent requests', async () => {
    // 1. Logout
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${authToken}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // 2. Subsequent request using same token must fail with 401
    const subsequentRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(subsequentRes.status).toBe(401);
    expect(subsequentRes.body.error.code).toBe('INVALID_SESSION');
  });
});
