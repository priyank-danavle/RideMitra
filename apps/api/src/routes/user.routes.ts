import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { userRepository } from '../repositories/user.repository.js';
import type { ApiResponse, UserSafeProfile } from '@ridemitra/shared';

export const userRouter = Router();

// Strict schema: mass-assignment protection prevents injecting role, id, email, etc.
const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(
        /^(\+91[-\s]?)?[6-9]\d{9}$/,
        'Invalid mobile phone number format (e.g., +919876543210)',
      )
      .nullable()
      .optional(),
    bio: z.string().trim().max(500, 'Bio cannot exceed 500 characters').nullable().optional(),
  })
  .strict({
    message: 'Forbidden: You cannot modify privileged fields or internal identifiers.',
  });

/**
 * GET /api/v1/users/profile
 * Retrieve profile of authenticated user
 */
userRouter.get('/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

/**
 * PATCH /api/v1/users/profile
 * Update allowed profile fields (name, phone, bio) with mass-assignment protection
 */
userRouter.patch(
  '/profile',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = updateProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0]?.message || 'Invalid profile update payload',
            details: parseResult.error.format(),
          },
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required.',
          },
        });
        return;
      }

      const updatedUser = await userRepository.updateProfile(req.user.id, parseResult.data);

      const responsePayload: ApiResponse<{ user: UserSafeProfile }> = {
        success: true,
        data: {
          user: updatedUser,
        },
      };

      res.status(200).json(responsePayload);
    } catch (err) {
      next(err);
    }
  },
);
