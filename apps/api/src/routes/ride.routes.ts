import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { rideRepository } from '../repositories/ride.repository.js';
import { vehicleRepository } from '../repositories/vehicle.repository.js';
import { authenticate } from '../middleware/auth.middleware.js';
import type { RideStatus, SpecificVehicleType, RideType } from '@ridemitra/shared';

export const rideRouter = Router();

const createRideSchema = z
  .object({
    vehicleId: z.string().trim().min(1, 'Vehicle is required'),
    type: z.enum(['CITY', 'INTERCITY'], {
      errorMap: () => ({ message: "Ride type must be either 'CITY' or 'INTERCITY'" }),
    }),
    origin: z
      .string()
      .trim()
      .min(2, 'Origin must be at least 2 characters')
      .max(100, 'Origin cannot exceed 100 characters'),
    destination: z
      .string()
      .trim()
      .min(2, 'Destination must be at least 2 characters')
      .max(100, 'Destination cannot exceed 100 characters'),
    pickupPoint: z.string().trim().max(255).nullable().optional(),
    dropoffPoint: z.string().trim().max(255).nullable().optional(),
    departureTime: z
      .string()
      .trim()
      .refine(
        (val) => {
          const d = new Date(val);
          return !isNaN(d.getTime()) && d.getTime() > Date.now();
        },
        { message: 'Departure time must be a valid future date and time' },
      ),
    availableSeats: z
      .number({ invalid_type_error: 'Available seats must be a number' })
      .int('Seats must be a whole number')
      .min(1, 'At least 1 seat must be offered')
      .max(8, 'Maximum 8 seats can be offered'),
    pricePerSeat: z
      .number({ invalid_type_error: 'Price must be a number' })
      .min(0, 'Price per seat cannot be negative')
      .max(100000, 'Price per seat exceeds allowed threshold')
      .optional()
      .default(0),
    description: z
      .string()
      .trim()
      .max(1000, 'Description cannot exceed 1000 characters')
      .nullable()
      .optional(),
  })
  .strict();

const updateRideSchema = z
  .object({
    pickupPoint: z.string().trim().max(255).nullable().optional(),
    dropoffPoint: z.string().trim().max(255).nullable().optional(),
    departureTime: z
      .string()
      .trim()
      .refine(
        (val) => {
          const d = new Date(val);
          return !isNaN(d.getTime()) && d.getTime() > Date.now();
        },
        { message: 'Departure time must be a valid future date and time' },
      )
      .optional(),
    availableSeats: z
      .number()
      .int()
      .min(1, 'At least 1 seat must be offered')
      .max(8, 'Maximum 8 seats can be offered')
      .optional(),
    pricePerSeat: z
      .number()
      .min(0, 'Price per seat cannot be negative')
      .max(100000, 'Price per seat exceeds allowed threshold')
      .optional(),
    description: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

/**
 * POST /api/v1/rides
 * Offer a new ride using a vehicle owned by the authenticated user
 */
rideRouter.post(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = createRideSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message || 'Invalid ride payload',
            details: parsed.error.format(),
          },
        });
        return;
      }

      const driverId = req.user!.id;
      const data = parsed.data;

      // 1. Verify vehicle ownership and active status
      const vehicle = await vehicleRepository.findVehicleById(data.vehicleId, driverId, true);
      if (!vehicle) {
        res.status(403).json({
          success: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Selected vehicle was not found or is not registered to your account.',
          },
        });
        return;
      }

      if (!vehicle.isActive) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VEHICLE_INACTIVE',
            message: 'Selected vehicle is inactive. Please activate or select another vehicle.',
          },
        });
        return;
      }

      // 2. Validate seat capacity against vehicle limits
      if (vehicle.type === 'BIKE' && data.availableSeats !== 1) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CAPACITY',
            message: 'Bikepool rides can offer exactly 1 passenger seat.',
          },
        });
        return;
      }

      if (data.availableSeats > vehicle.capacity) {
        res.status(400).json({
          success: false,
          error: {
            code: 'EXCEEDS_VEHICLE_CAPACITY',
            message: `Offered seats (${data.availableSeats}) cannot exceed the registered vehicle capacity (${vehicle.capacity}).`,
          },
        });
        return;
      }

      // 3. Create ride
      const ride = await rideRepository.createRide(driverId, data);

      res.status(201).json({
        success: true,
        data: { ride },
        message: 'Ride offered successfully.',
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/v1/rides
 * Search and discover available rides with filters and pagination
 */
rideRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const origin = typeof req.query.origin === 'string' ? req.query.origin : undefined;
    const destination =
      typeof req.query.destination === 'string' ? req.query.destination : undefined;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    const type = typeof req.query.type === 'string' ? (req.query.type as RideType) : undefined;
    const vehicleType =
      typeof req.query.vehicleType === 'string'
        ? (req.query.vehicleType as SpecificVehicleType | 'ALL')
        : undefined;

    const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined;
    const minSeats = req.query.minSeats !== undefined ? Number(req.query.minSeats) : undefined;

    const sortBy = req.query.sortBy === 'price' ? 'price' : 'departureTime';
    const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
    const page = req.query.page !== undefined ? Number(req.query.page) : 1;
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : 10;

    const results = await rideRepository.searchRides({
      origin,
      destination,
      date,
      type,
      vehicleType,
      minPrice: isNaN(minPrice as number) ? undefined : minPrice,
      maxPrice: isNaN(maxPrice as number) ? undefined : maxPrice,
      minSeats: isNaN(minSeats as number) ? undefined : minSeats,
      sortBy,
      sortOrder,
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 10 : limit,
    });

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/rides/my-rides
 * and GET /api/v1/rides/driver/mine
 * Retrieve all rides offered by the authenticated driver
 */
const myRidesHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const driverId = req.user!.id;
    const status =
      typeof req.query.status === 'string' ? (req.query.status as RideStatus | 'ALL') : 'ALL';

    const rides = await rideRepository.findDriverRides(driverId, status);

    res.status(200).json({
      success: true,
      data: { rides },
    });
  } catch (error) {
    next(error);
  }
};

rideRouter.get('/my-rides', authenticate, myRidesHandler);
rideRouter.get('/driver/mine', authenticate, myRidesHandler);

/**
 * GET /api/v1/rides/:id
 * Retrieve single ride details with public driver and vehicle info
 */
rideRouter.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rideId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const ride = await rideRepository.findRideById(rideId);
    if (!ride) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ride not found.',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { ride },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/rides/:id
 * Update eligible details of a scheduled ride belonging to the driver
 */
rideRouter.patch(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = updateRideSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message || 'Invalid update payload',
            details: parsed.error.format(),
          },
        });
        return;
      }

      const driverId = req.user!.id;
      const rideId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      // 1. Verify existence and ownership
      const existing = await rideRepository.findRideById(rideId);
      if (!existing || existing.driverId !== driverId) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Ride not found or you do not have permission to modify it.',
          },
        });
        return;
      }

      if (existing.status !== 'SCHEDULED') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot modify a ride in '${existing.status}' status.`,
          },
        });
        return;
      }

      // If available seats is updated, verify it doesn't exceed vehicle capacity
      if (parsed.data.availableSeats && existing.vehicle) {
        if (parsed.data.availableSeats > existing.vehicle.capacity) {
          res.status(400).json({
            success: false,
            error: {
              code: 'EXCEEDS_CAPACITY',
              message: `Available seats cannot exceed vehicle capacity (${existing.vehicle.capacity}).`,
            },
          });
          return;
        }
      }

      const updated = await rideRepository.updateRide(rideId, driverId, parsed.data);

      res.status(200).json({
        success: true,
        data: { ride: updated },
        message: 'Ride updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/v1/rides/:id/cancel
 * or DELETE /api/v1/rides/:id
 * Cancel a ride offered by the driver
 */
const cancelHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const driverId = req.user!.id;
    const rideId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const existing = await rideRepository.findRideById(rideId);
    if (!existing || existing.driverId !== driverId) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ride not found or you do not have permission to cancel it.',
        },
      });
      return;
    }

    await rideRepository.cancelRide(rideId, driverId);

    res.status(200).json({
      success: true,
      data: null,
      message: 'Ride cancelled successfully.',
    });
  } catch (error) {
    next(error);
  }
};

rideRouter.post('/:id/cancel', authenticate, cancelHandler);
rideRouter.delete('/:id', authenticate, cancelHandler);
