import type { Request, Response, NextFunction } from 'express';
import type { UserSafeProfile, UserRole } from '@ridemitra/shared';
import { config } from '../config/index.js';
import { validateSession } from '../services/token.service.js';
import { userRepository } from '../repositories/user.repository.js';

// Extend Express Request declaration
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserSafeProfile;
      sessionId?: string;
      token?: string;
    }
  }
}

/**
 * Middleware ensuring incoming request has a valid session token (via cookie or Bearer header)
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check cookies first (browser flow)
    if (req.cookies && req.cookies[config.auth.cookieName]) {
      token = req.cookies[config.auth.cookieName];
    }

    // 2. Fallback to Authorization header (API / mobile / testing flow)
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to access this resource.',
        },
      });
      return;
    }

    const payload = await validateSession(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_SESSION',
          message: 'Your session has expired or been revoked. Please sign in again.',
        },
      });
      return;
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account associated with this session no longer exists.',
        },
      });
      return;
    }

    req.user = user;
    req.sessionId = payload.sessionId;
    req.token = token;

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Restricts access to users with specified role
 */
export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires '${role}' privilege.`,
        },
      });
      return;
    }
    next();
  };
}
