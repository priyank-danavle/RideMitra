import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bookingRepository, BookingRepositoryError } from '../repositories/booking.repository.js';
import { authenticate } from '../middleware/auth.middleware.js';
import type { BookingStatus } from '@ridemitra/shared';

export const bookingRouter = Router();

const createBookingSchema = z.object({
  rideId: z.string().trim().min(1, 'Ride ID is required'),
  seatsBooked: z
    .number({ invalid_type_error: 'Seats booked must be a number' })
    .int('Seats booked must be a whole number')
    .min(1, 'You must book at least 1 seat')
    .max(8, 'Cannot book more than 8 seats in a single request')
    .default(1),
});

/**
 * POST /api/v1/bookings
 * Request a seat booking for a scheduled ride
 */
bookingRouter.post(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = createBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message || 'Invalid booking request.',
            details: parsed.error.flatten(),
          },
        });
        return;
      }

      const passengerId = req.user!.id;
      const { rideId, seatsBooked } = parsed.data;

      const booking = await bookingRepository.createBooking(passengerId, rideId, seatsBooked);

      res.status(201).json({
        success: true,
        data: { booking },
        message: 'Booking request submitted successfully.',
      });
    } catch (error) {
      if (error instanceof BookingRepositoryError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }
      next(error);
    }
  },
);

/**
 * GET /api/v1/bookings/passenger/mine
 * List all bookings made by the currently authenticated passenger
 */
bookingRouter.get(
  '/passenger/mine',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const passengerId = req.user!.id;
      const status = req.query.status as BookingStatus | undefined;

      const bookings = await bookingRepository.findPassengerBookings(passengerId, status);

      res.status(200).json({
        success: true,
        data: { bookings },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/v1/bookings/driver/mine
 * List all booking requests for rides offered by the currently authenticated driver
 */
bookingRouter.get(
  '/driver/mine',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driverId = req.user!.id;
      const rideId = typeof req.query.rideId === 'string' ? req.query.rideId : undefined;
      const status = req.query.status as BookingStatus | undefined;

      const bookings = await bookingRepository.findDriverBookings(driverId, rideId, status);

      res.status(200).json({
        success: true,
        data: { bookings },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/v1/bookings/ride/:rideId
 * Retrieve bookings for a specific ride offered by the authenticated driver
 */
bookingRouter.get(
  '/ride/:rideId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driverId = req.user!.id;
      const rideId = Array.isArray(req.params.rideId) ? req.params.rideId[0] : req.params.rideId;

      const bookings = await bookingRepository.findRideBookings(rideId, driverId);

      res.status(200).json({
        success: true,
        data: { bookings },
      });
    } catch (error) {
      if (error instanceof BookingRepositoryError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }
      next(error);
    }
  },
);

/**
 * GET /api/v1/bookings/:id
 * Retrieve a specific booking (accessible to passenger or driver)
 */
bookingRouter.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const userId = req.user!.id;

      const booking = await bookingRepository.findBookingById(bookingId);
      if (!booking) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Booking not found.',
          },
        });
        return;
      }

      const isPassenger = booking.passengerId === userId;
      const isDriver = booking.ride?.driverId === userId;

      if (!isPassenger && !isDriver) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You are not authorized to view this booking.',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/v1/bookings/:id/confirm
 * Driver accepts and confirms a pending booking request (locks and decrements seats)
 */
bookingRouter.post(
  '/:id/confirm',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const driverId = req.user!.id;

      const booking = await bookingRepository.confirmBooking(bookingId, driverId);

      res.status(200).json({
        success: true,
        data: { booking },
        message: 'Booking request confirmed successfully.',
      });
    } catch (error) {
      if (error instanceof BookingRepositoryError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }
      next(error);
    }
  },
);

/**
 * POST /api/v1/bookings/:id/reject
 * Driver rejects a pending booking request
 */
bookingRouter.post(
  '/:id/reject',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const driverId = req.user!.id;

      const booking = await bookingRepository.rejectBooking(bookingId, driverId);

      res.status(200).json({
        success: true,
        data: { booking },
        message: 'Booking request rejected.',
      });
    } catch (error) {
      if (error instanceof BookingRepositoryError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }
      next(error);
    }
  },
);

/**
 * POST /api/v1/bookings/:id/cancel
 * Passenger or driver cancels a booking (releases seats if confirmed)
 */
bookingRouter.post(
  '/:id/cancel',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const userId = req.user!.id;

      const booking = await bookingRepository.cancelBooking(bookingId, userId);

      res.status(200).json({
        success: true,
        data: { booking },
        message: 'Booking cancelled successfully.',
      });
    } catch (error) {
      if (error instanceof BookingRepositoryError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }
      next(error);
    }
  },
);
