import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { PageTransition } from './components/PageTransition';
import { RideDetailsPage } from './pages/RideDetailsPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { MyRidesPage } from './pages/MyRidesPage';
import { apiClient } from './lib/apiClient';
import type { Ride, Booking, UserSafeProfile } from '@ridemitra/shared';

const mockRide: Ride = {
  id: 'ride-1',
  driverId: 'user-driver-1',
  vehicleId: 'veh-car-1',
  type: 'INTERCITY',
  origin: 'Surat',
  destination: 'Ahmedabad',
  pickupPoint: 'Adajan Star Bazaar',
  dropoffPoint: 'SG Highway Iscon',
  departureTime: new Date(Date.now() + 86400000).toISOString(),
  status: 'SCHEDULED',
  totalSeats: 4,
  availableSeats: 3,
  pricePerSeat: 250,
  description: 'Express highway carpool with AC.',
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
    id: 'user-driver-1',
    name: 'Priyank Danavle',
    bio: 'Verified Commuter',
    isVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
};

const mockPassengerBooking: Booking = {
  id: 'booking-101',
  rideId: 'ride-1',
  passengerId: 'user-passenger-2',
  seatsBooked: 2,
  pricePerSeat: 250,
  totalPrice: 500,
  status: 'PENDING',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ride: {
    id: 'ride-1',
    driverId: 'user-driver-1',
    origin: 'Surat',
    destination: 'Ahmedabad',
    pickupPoint: 'Adajan Star Bazaar',
    dropoffPoint: 'SG Highway Iscon',
    departureTime: new Date(Date.now() + 86400000).toISOString(),
    type: 'INTERCITY',
    status: 'SCHEDULED',
    pricePerSeat: 250,
    totalSeats: 4,
    availableSeats: 3,
    driver: {
      id: 'user-driver-1',
      name: 'Priyank Danavle',
      bio: 'Verified Commuter',
      isVerified: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    vehicle: {
      id: 'veh-car-1',
      make: 'Maruti',
      model: 'Baleno',
      type: 'CAR',
      year: 2022,
      color: 'Blue',
      capacity: 4,
    },
  },
  passenger: {
    id: 'user-passenger-2',
    name: 'Rohan Sharma',
    bio: 'Commuter',
    isVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
};

describe('Phase 4 Frontend: Booking Engine, Concurrency & Animated Navigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.spyOn(apiClient, 'getPassengerBookings').mockResolvedValue({ bookings: [] });
  });

  const passengerUser: UserSafeProfile = {
    id: 'user-passenger-2',
    name: 'Rohan Sharma',
    email: 'rohan@example.com',
    phone: '+919876543210',
    bio: 'Commuter',
    role: 'USER',
    isEmailVerified: true,
    isPhoneVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const driverUser: UserSafeProfile = {
    id: 'user-driver-1',
    name: 'Priyank Danavle',
    email: 'priyank@example.com',
    phone: '+919876543211',
    bio: 'Driver',
    role: 'USER',
    isEmailVerified: true,
    isPhoneVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const setupPassengerAuth = () => {
    vi.spyOn(apiClient, 'getMe').mockResolvedValue({ user: passengerUser });
    localStorage.setItem(
      'ridemitra_auth_token',
      JSON.stringify({
        token: 'fake-jwt-token-passenger',
        user: passengerUser,
      }),
    );
  };

  const setupDriverAuth = () => {
    vi.spyOn(apiClient, 'getMe').mockResolvedValue({ user: driverUser });
    localStorage.setItem(
      'ridemitra_auth_token',
      JSON.stringify({
        token: 'fake-jwt-token-driver',
        user: driverUser,
      }),
    );
  };

  describe('Navigation Polish & Route Transitions', () => {
    it('Navbar renders My Bookings link for authenticated users', async () => {
      setupPassengerAuth();

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Navbar />
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(await screen.findByRole('link', { name: /My Bookings/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /My Rides/i })).toBeInTheDocument();
    });

    it('PageTransition wraps components and renders cleanly', () => {
      const { container } = render(
        <PageTransition className="test-page-transition">
          <div>Page Content</div>
        </PageTransition>,
      );

      expect(screen.getByText('Page Content')).toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('RideDetailsPage Booking Flow', () => {
    it('allows an authenticated passenger to select seats and submit a booking request', async () => {
      setupPassengerAuth();

      vi.spyOn(apiClient, 'getRideById').mockResolvedValue({ ride: mockRide });
      const createBookingSpy = vi.spyOn(apiClient, 'createBooking').mockResolvedValue({
        message: 'Booking request created successfully',
        booking: {
          ...mockPassengerBooking,
          seatsBooked: 2,
          totalPrice: 500,
        },
      });

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
      expect(screen.getByText(/3 Seats Available/i)).toBeInTheDocument();

      // Verify booking section rendered
      expect(screen.getByText(/Reserve Passenger Seats/i)).toBeInTheDocument();
      expect(screen.getByText(/Number of Seats Requested/i)).toBeInTheDocument();

      // Initial price calculation (1 seat x ₹250 = ₹250)
      expect(screen.getAllByText('₹250').length).toBeGreaterThan(0);

      // Click + button to request 2 seats
      const increaseBtn = screen.getByRole('button', { name: /Increase seats/i });
      fireEvent.click(increaseBtn);

      // Total fare should update to ₹500
      expect((await screen.findAllByText('₹500')).length).toBeGreaterThan(0);

      // Submit booking
      const submitBtn = screen.getByRole('button', { name: /Request Seat Reservation/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(createBookingSpy).toHaveBeenCalledWith({
          rideId: 'ride-1',
          seatsBooked: 2,
        });
      });

      // Shows success feedback and updated active reservation badge
      expect(
        await screen.findByText(/Booking request for 2 seat\(s\) submitted/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Your Reservation is Active/i)).toBeInTheDocument();
    });

    it('displays driver management banner and disables booking for ride owner', async () => {
      setupDriverAuth();

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

      expect(await screen.findByText(/You are the driver of this ride/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Manage in My Rides/i })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Request Seat Reservation/i }),
      ).not.toBeInTheDocument();
    });

    it('prompts unauthenticated users to sign in to book', async () => {
      vi.spyOn(apiClient, 'getMe').mockRejectedValue(new Error('Unauthorized'));
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

      expect(await screen.findByText(/Want to Join This Ride\?/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Sign In to Reserve Seats/i })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Request Seat Reservation/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('MyBookingsPage Passenger Reservations', () => {
    it('renders passenger bookings with status, seats, driver, and cancellation modal', async () => {
      setupPassengerAuth();

      vi.spyOn(apiClient, 'getPassengerBookings').mockResolvedValue({
        bookings: [mockPassengerBooking],
      });
      const cancelBookingSpy = vi.spyOn(apiClient, 'cancelBooking').mockResolvedValue({
        message: 'Booking cancelled successfully',
        booking: {
          ...mockPassengerBooking,
          status: 'CANCELLED',
        },
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <MyBookingsPage />
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(await screen.findByText('My Bookings')).toBeInTheDocument();
      expect(screen.getByText(/Surat/i)).toBeInTheDocument();
      expect(screen.getByText(/Ahmedabad/i)).toBeInTheDocument();
      expect(screen.getByText(/Pending Driver Approval/i)).toBeInTheDocument();
      expect(screen.getByText(/2 Seats/i)).toBeInTheDocument();
      expect(screen.getByText(/₹500/i)).toBeInTheDocument();

      // Open cancel reservation dialog
      const cancelBtn = screen.getByRole('button', { name: /Cancel Reservation/i });
      fireEvent.click(cancelBtn);

      expect(await screen.findByText(/Cancel This Reservation\?/i)).toBeInTheDocument();

      // Confirm cancellation
      const confirmCancelBtn = screen.getByRole('button', { name: /Confirm Cancellation/i });
      fireEvent.click(confirmCancelBtn);

      await waitFor(() => {
        expect(cancelBookingSpy).toHaveBeenCalledWith('booking-101');
      });
    });

    it('renders empty state when passenger has no bookings', async () => {
      setupPassengerAuth();

      vi.spyOn(apiClient, 'getPassengerBookings').mockResolvedValue({ bookings: [] });

      render(
        <MemoryRouter>
          <AuthProvider>
            <MyBookingsPage />
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(await screen.findByText(/No Active Reservations/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Discover Available Rides/i })).toBeInTheDocument();
    });
  });

  describe('MyRidesPage Driver Booking Review & Seat Confirmation', () => {
    it('renders driver requests tab and allows accepting or rejecting pending requests', async () => {
      setupDriverAuth();

      vi.spyOn(apiClient, 'getMyRides').mockResolvedValue({ rides: [mockRide] });
      vi.spyOn(apiClient, 'getDriverBookings').mockResolvedValue({
        bookings: [mockPassengerBooking],
      });
      const confirmBookingSpy = vi.spyOn(apiClient, 'confirmBooking').mockResolvedValue({
        message: 'Booking confirmed successfully',
        booking: {
          ...mockPassengerBooking,
          status: 'CONFIRMED',
        },
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <MyRidesPage />
          </AuthProvider>
        </MemoryRouter>,
      );

      // Verify Upcoming Rides view shows pending requests indicator
      expect(await screen.findByText(/1 Pending Request/i)).toBeInTheDocument();

      // Switch to Passenger Requests tab
      const requestsTab = screen.getByRole('button', { name: /Passenger Requests/i });
      fireEvent.click(requestsTab);

      // Verify booking request details
      expect(await screen.findByText(/Action Needed: Pending/i)).toBeInTheDocument();
      expect(screen.getByText(/Rohan Sharma/i)).toBeInTheDocument();
      expect(screen.getByText(/2 seats/i)).toBeInTheDocument();
      expect(screen.getByText(/₹500/i)).toBeInTheDocument();

      // Click Accept & Lock Seats
      const acceptBtn = screen.getByRole('button', { name: /Accept & Lock Seats/i });
      fireEvent.click(acceptBtn);

      await waitFor(() => {
        expect(confirmBookingSpy).toHaveBeenCalledWith('booking-101');
      });
    });
  });
});
