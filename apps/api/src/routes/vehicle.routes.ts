import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { vehicleRepository } from '../repositories/vehicle.repository.js';
import type { ApiResponse, Vehicle } from '@ridemitra/shared';

export const vehicleRouter = Router();

// Require authentication for all vehicle operations
vehicleRouter.use(authenticate);

const currentYear = new Date().getFullYear();

const createVehicleSchema = z
  .object({
    type: z.enum(['CAR', 'BIKE'], {
      errorMap: () => ({ message: "Vehicle type must be either 'CAR' or 'BIKE'" }),
    }),
    make: z
      .string({ required_error: 'Vehicle make is required (e.g., Maruti Suzuki, Honda)' })
      .trim()
      .min(2, 'Make must be at least 2 characters')
      .max(50, 'Make cannot exceed 50 characters'),
    model: z
      .string({ required_error: 'Vehicle model is required (e.g., Swift, Activa)' })
      .trim()
      .min(1, 'Model must be at least 1 character')
      .max(50, 'Model cannot exceed 50 characters'),
    year: z
      .number({ required_error: 'Manufacturing year is required' })
      .int('Year must be an integer')
      .min(1990, 'Year must be 1990 or newer')
      .max(currentYear + 1, `Year cannot exceed ${currentYear + 1}`),
    color: z
      .string({ required_error: 'Vehicle color is required' })
      .trim()
      .min(2, 'Color must be at least 2 characters')
      .max(30, 'Color cannot exceed 30 characters'),
    registrationNumber: z
      .string({ required_error: 'Registration number is required' })
      .trim()
      .min(4, 'Registration number must be at least 4 characters')
      .max(20, 'Registration number cannot exceed 20 characters')
      .regex(
        /^[A-Z0-9\-\s]+$/i,
        'Invalid registration number format (alphanumeric with optional dashes)',
      ),
    capacity: z
      .number({ required_error: 'Seating capacity is required' })
      .int('Capacity must be an integer')
      .min(1, 'Seating capacity must be at least 1'),
  })
  .refine(
    (data) => {
      if (data.type === 'BIKE') {
        return data.capacity === 1;
      }
      return data.capacity >= 1 && data.capacity <= 8;
    },
    {
      message:
        'Bikepooling capacity must be exactly 1 passenger seat. Carpooling capacity must be between 1 and 8 seats.',
      path: ['capacity'],
    },
  );

const updateVehicleSchema = z
  .object({
    make: z.string().trim().min(2).max(50).optional(),
    model: z.string().trim().min(1).max(50).optional(),
    year: z
      .number()
      .int()
      .min(1990)
      .max(currentYear + 1)
      .optional(),
    color: z.string().trim().min(2).max(30).optional(),
    capacity: z.number().int().min(1).max(8).optional(),
  })
  .strict({
    message:
      'Forbidden: You cannot modify vehicle type, registration number, or verification status directly.',
  });

/**
 * POST /api/v1/vehicles
 * Register a new vehicle for the authenticated user
 */
vehicleRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = createVehicleSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid vehicle payload',
          details: parseResult.error.format(),
        },
      });
      return;
    }

    const vehicle = await vehicleRepository.createVehicle({
      userId: req.user!.id,
      ...parseResult.data,
    });

    const responsePayload: ApiResponse<{ vehicle: Vehicle }> = {
      success: true,
      data: {
        vehicle,
      },
    };

    res.status(201).json(responsePayload);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/vehicles
 * List all active vehicles belonging to the authenticated user
 */
vehicleRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicles = await vehicleRepository.findVehiclesByUserId(req.user!.id);

    const responsePayload: ApiResponse<{ vehicles: Vehicle[] }> = {
      success: true,
      data: {
        vehicles,
      },
    };

    res.status(200).json(responsePayload);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/vehicles/:id
 * Retrieve a specific vehicle owned by the authenticated user
 */
vehicleRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const vehicle = await vehicleRepository.findVehicleById(vehicleId, req.user!.id);
      if (!vehicle) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found or does not belong to your account.',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          vehicle,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /api/v1/vehicles/:id
 * Update permitted details of a vehicle owned by the authenticated user
 */
vehicleRouter.patch(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = updateVehicleSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0]?.message || 'Invalid vehicle update payload',
            details: parseResult.error.format(),
          },
        });
        return;
      }

      const vehicleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updatedVehicle = await vehicleRepository.updateVehicle(
        vehicleId,
        req.user!.id,
        parseResult.data,
      );

      if (!updatedVehicle) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found or does not belong to your account.',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          vehicle: updatedVehicle,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /api/v1/vehicles/:id
 * Safely deactivate a vehicle owned by the authenticated user
 */
vehicleRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const success = await vehicleRepository.deactivateVehicle(vehicleId, req.user!.id);
      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found or does not belong to your account.',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          message: 'Vehicle deactivated successfully.',
        },
      });
    } catch (err) {
      next(err);
    }
  },
);
