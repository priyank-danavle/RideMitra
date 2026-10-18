import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { config } from '../config/index.js';
import { userRepository, mapUserRowToSafeProfile } from '../repositories/user.repository.js';
import { hashPassword, verifyPassword } from '../services/password.service.js';
import { createSession, revokeSession } from '../services/token.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import type { AuthResponse, ApiResponse } from '@ridemitra/shared';

export const authRouter = Router();

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address format')
    .max(255, 'Email cannot exceed 255 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters'),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address format'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password cannot be empty'),
});

function setSessionCookie(res: Response, token: string): void {
  res.cookie(config.auth.cookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  });
}

function clearSessionCookie(res: Response): void {
  res.clearCookie(config.auth.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    path: '/',
  });
}

/**
 * POST /api/v1/auth/register
 * Register a new user account with secure password hashing
 */
authRouter.post(
  '/register',
  authRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0]?.message || 'Invalid registration payload',
            details: parseResult.error.format(),
          },
        });
        return;
      }

      const { name, email, password } = parseResult.data;

      // 1. Check duplicate email
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'An account with this email address already exists.',
          },
        });
        return;
      }

      // 2. Hash password & create user
      const passwordHash = await hashPassword(password);
      const user = await userRepository.createUser({
        name,
        email,
        passwordHash,
      });

      // 3. Create authenticated session
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;
      const { token } = await createSession(user.id, userAgent, ipAddress);

      // 4. Set HTTP-only session cookie
      setSessionCookie(res, token);

      const responsePayload: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          user,
          token,
        },
      };

      res.status(201).json(responsePayload);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v1/auth/login
 * Authenticate user and issue secure session cookie
 */
authRouter.post(
  '/login',
  authRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0]?.message || 'Invalid login payload',
            details: parseResult.error.format(),
          },
        });
        return;
      }

      const { email, password } = parseResult.data;

      const userRow = await userRepository.findByEmail(email);
      if (!userRow) {
        // Generic error message to prevent account enumeration
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password.',
          },
        });
        return;
      }

      const isPasswordValid = await verifyPassword(password, userRow.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password.',
          },
        });
        return;
      }

      const user = mapUserRowToSafeProfile(userRow);
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;
      const { token } = await createSession(user.id, userAgent, ipAddress);

      setSessionCookie(res, token);

      const responsePayload: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          user,
          token,
        },
      };

      res.status(200).json(responsePayload);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v1/auth/logout
 * Revoke the current authentication session and clear session cookie
 */
authRouter.post(
  '/logout',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.token) {
        await revokeSession(req.token);
      }
      clearSessionCookie(res);

      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully.',
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v1/auth/me
 * Retrieve currently authenticated user safe profile
 */
authRouter.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});
