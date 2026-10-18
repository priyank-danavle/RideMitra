import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RidesPage } from './pages/RidesPage';
import { OfferRidePage } from './pages/OfferRidePage';
import { RideDetailsPage } from './pages/RideDetailsPage';
import { MyRidesPage } from './pages/MyRidesPage';
import { apiClient } from './lib/apiClient';
import type { Ride, Vehicle } from '@ridemitra/shared';

const mockVehicle: Vehicle = {
  id: 'veh-car-1',
  userId: 'user-1',
  type: 'CAR',
  make: 'Maruti',
  model: 'Baleno',
  year: 2022,
  color: 'Blue',
  registrationNumber: 'GJ-05-CD-5678',
  capacity: 4,
  isActive: true,
  isVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockBike: Vehicle = {
  id: 'veh-bike-1',
  userId: 'user-1',
  type: 'BIKE',
  make: 'Honda',
  model: 'Activa 6G',
  year: 2023,
  color: 'White',
  registrationNumber: 'GJ-05-EF-9012',
  capacity: 1,
  isActive: true,
  isVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockRide: Ride = {
  id: 'ride-1',
  driverId: 'user-1',
  vehicleId: 'veh-car-1',
  type: 'INTERCITY',
  origin: 'Surat',
  destination: 'Ahmedabad',
  pickupPoint: 'Adajan Star Bazaar',
  dropoffPoint: 'SG Highway Iscon',
  departureTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  status: 'SCHEDULED',
  totalSeats: 3,
  availableSeats: 3,
  pricePerSeat: 250,
  description: 'AC car, music allowed, punctual departure.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  vehicle: {
    id: 'veh-car-1',
    make: 'Maruti',
    model: 'Baleno',
    type: 'CAR',
    year: 2022,
    color: 'Blue',
    capacity: 4,
    registrationNumber: 'GJ-05-CD-5678',
  },
  driver: {
    id: 'user-1',
    name: 'Priyank Danavle',
    bio: 'Daily commuter between Surat and Ahmedabad.',
    isVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
};

describe('Phase 3 Frontend: Ride Management, Discovery & Details', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem(
      'ridemitra_auth_token',
      JSON.stringify({
        token: 'fake-jwt-token',
        user: {
          id: 'user-1',
          name: 'Priyank Danavle',
          email: 'priyank@example.com',
          role: 'DRIVER',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      }),
    );
  });

  describe('RidesPage (Discovery & Search)', () => {
    it('renders search bar, filters, and displays fetched ride cards with public driver info', async () => {
      vi.spyOn(apiClient, 'searchRides').mockResolvedValue({
        items: [mockRide],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      render(
        <MemoryRouter>
          <RidesPage />
        </MemoryRouter>,
      );

      expect(screen.getByText(/Discover Shared Rides/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Origin/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Destination/i)).toBeInTheDocument();

      // Ride Card Information
      expect(await screen.findByText('Surat')).toBeInTheDocument();
      expect(screen.getByText('Ahmedabad')).toBeInTheDocument();
      expect(screen.getByText('₹250')).toBeInTheDocument();
      expect(screen.getByText('3 of 3 seat(s)')).toBeInTheDocument();
      expect(screen.getByText('Maruti Baleno')).toBeInTheDocument();
      expect(screen.getByText('Priyank Danavle')).toBeInTheDocument();
      expect(screen.getByText(/View Details/i)).toBeInTheDocument();
    });

    it('displays an empty state when no rides match criteria', async () => {
      vi.spyOn(apiClient, 'searchRides').mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      render(
        <MemoryRouter>
          <RidesPage />
        </MemoryRouter>,
      );

      expect(await screen.findByText(/No Rides Found/i)).toBeInTheDocument();
      expect(
        screen.getByText(/There are currently no scheduled rides matching your origin/i),
      ).toBeInTheDocument();
    });
  });

  describe('OfferRidePage (Create Ride Form)', () => {
    it('validates departure time in the past and seat limits before submitting', async () => {
      vi.spyOn(apiClient, 'getVehicles').mockResolvedValue({
        vehicles: [mockVehicle, mockBike],
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <OfferRidePage />
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(await screen.findByText('1. Route & Corridor')).toBeInTheDocument();
      expect(screen.getByLabelText(/Origin City \/ Area \*/i)).toBeInTheDocument();

      // Fill in origin & destination
      fireEvent.change(screen.getByLabelText(/Origin City \/ Area \*/i), {
        target: { value: 'Surat' },
      });
      fireEvent.change(screen.getByLabelText(/Destination City \/ Area \*/i), {
        target: { value: 'Vadodara' },
      });

      // Set date to yesterday to test past departure validation
      fireEvent.change(screen.getByLabelText(/Travel Date \*/i), {
        target: { value: '2020-01-01' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Publish Ride/i }));

      expect(await screen.findByText(/Departure time must be in the future/i)).toBeInTheDocument();
    });

    it('enforces single-seat capacity when bikepool vehicle is chosen', async () => {
      vi.spyOn(apiClient, 'getVehicles').mockResolvedValue({
        vehicles: [mockVehicle, mockBike],
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <OfferRidePage />
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(await screen.findByLabelText(/Select Vehicle \*/i)).toBeInTheDocument();

      // Switch to Activa (Bike)
      fireEvent.change(screen.getByLabelText(/Select Vehicle \*/i), {
        target: { value: mockBike.id },
      });

      const seatInput = screen.getByLabelText(/Passenger Seats Offered \*/i) as HTMLInputElement;
      expect(seatInput.value).toBe('1');
      expect(seatInput).toBeDisabled();
    });

    it('submits valid ride offering to the backend', async () => {
      vi.spyOn(apiClient, 'getVehicles').mockResolvedValue({
        vehicles: [mockVehicle],
      });
      const createSpy = vi.spyOn(apiClient, 'createRide').mockResolvedValue({
        message: 'Ride offered successfully',
        ride: mockRide,
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <OfferRidePage />
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(await screen.findByLabelText(/Origin City \/ Area \*/i)).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Origin City \/ Area \*/i), {
        target: { value: 'Surat' },
      });
      fireEvent.change(screen.getByLabelText(/Destination City \/ Area \*/i), {
        target: { value: 'Ahmedabad' },
      });
      // Future date
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      fireEvent.change(screen.getByLabelText(/Travel Date \*/i), {
        target: { value: futureDate },
      });
      fireEvent.change(screen.getByLabelText(/Departure Time \*/i), {
        target: { value: '14:30' },
      });
      fireEvent.change(screen.getByLabelText(/Price Per Passenger/i), {
        target: { value: '300' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Publish Ride/i }));

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            origin: 'Surat',
            destination: 'Ahmedabad',
            pricePerSeat: 300,
            vehicleId: mockVehicle.id,
          }),
        );
      });
    });
  });

  describe('RideDetailsPage (Dedicated Ride Details)', () => {
    it('displays full ride corridor, public driver info, and vehicle specs without exposing private phone/email', async () => {
      vi.spyOn(apiClient, 'getRideById').mockResolvedValue({ ride: mockRide });

      render(
        <MemoryRouter initialEntries={['/rides/ride-1']}>
          <AuthProvider>
            <Routes>
              <Route path="/rides/:id" element={<RideDetailsPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(await screen.findByText('Surat')).toBeInTheDocument();
      expect(screen.getByText('Ahmedabad')).toBeInTheDocument();
      expect(screen.getByText('Scheduled & Open')).toBeInTheDocument();
      expect(screen.getByText('3 Seats Available')).toBeInTheDocument();
      expect(screen.getByText('Maruti Baleno')).toBeInTheDocument();
      expect(screen.getByText('GJ-05-CD-5678')).toBeInTheDocument();
      expect(screen.getByText('Priyank Danavle')).toBeInTheDocument();
      expect(screen.getByText(/"Daily commuter between Surat and Ahmedabad."/)).toBeInTheDocument();

      // Crucial security requirement: NEVER expose private email or phone number on public ride details
      expect(screen.queryByText('priyank@example.com')).not.toBeInTheDocument();
      expect(screen.queryByText('+919876543210')).not.toBeInTheDocument();
    });
  });

  describe('MyRidesPage (Driver Management & Cancellation)', () => {
    it('renders scheduled rides and opens cancellation modal', async () => {
      vi.spyOn(apiClient, 'getMyRides').mockResolvedValue({
        rides: [mockRide],
      });
      const cancelSpy = vi.spyOn(apiClient, 'cancelRide').mockResolvedValue({
        message: 'Ride cancelled successfully',
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <MyRidesPage />
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(await screen.findByText('Surat')).toBeInTheDocument();
      expect(screen.getByText('Ahmedabad')).toBeInTheDocument();

      // Open cancel dialog
      const cancelBtn = screen.getByRole('button', { name: /Cancel Ride/i });
      fireEvent.click(cancelBtn);

      expect(screen.getByText(/Cancel Offered Ride\?/i)).toBeInTheDocument();

      // Confirm cancellation
      const confirmBtn = screen.getByRole('button', { name: /Yes, Cancel Ride/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(cancelSpy).toHaveBeenCalledWith(mockRide.id);
      });
    });
  });
});
