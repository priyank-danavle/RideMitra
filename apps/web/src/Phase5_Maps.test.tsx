import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OfferRidePage } from './pages/OfferRidePage';
import { RideDetailsPage } from './pages/RideDetailsPage';
import { RouteMap } from './components/maps/RouteMap';
import { RouteMetricsBadge } from './components/maps/RouteMetricsBadge';
import { MapErrorBoundary } from './components/maps/MapErrorBoundary';
import { fetchOsrmRoute } from './lib/osrm';
import { apiClient } from './lib/apiClient';
import type { Ride, Vehicle } from '@ridemitra/shared';

// Mock Vehicle for OfferRidePage
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

// Mock Ride with Phase 5.3 Coordinates & Route Metrics
const mockGeoRide: Ride = {
  id: 'ride-geo-1',
  driverId: 'user-1',
  vehicleId: 'veh-car-1',
  type: 'INTERCITY',
  origin: 'Surat',
  destination: 'Ahmedabad',
  pickupPoint: 'Adajan Star Bazaar',
  dropoffPoint: 'SG Highway Iscon',
  pickupLat: 21.1702,
  pickupLng: 72.8311,
  dropoffLat: 23.0225,
  dropoffLng: 72.5714,
  distanceKm: 265.4,
  durationMinutes: 270,
  departureTime: new Date(Date.now() + 86400000).toISOString(),
  status: 'SCHEDULED',
  totalSeats: 3,
  availableSeats: 3,
  pricePerSeat: 350,
  description: 'Smooth highway drive with OpenStreetMap preview.',
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
    bio: 'Commuter between Surat and Ahmedabad.',
    isVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
};

// Mock Legacy Ride WITHOUT Coordinates
const mockLegacyRide: Ride = {
  ...mockGeoRide,
  id: 'ride-legacy-1',
  pickupLat: null,
  pickupLng: null,
  dropoffLat: null,
  dropoffLng: null,
  distanceKm: null,
  durationMinutes: null,
};

describe('Phase 5.3 Free Maps & Location Integration (Leaflet + OSM + OSRM)', () => {
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

  describe('RouteMetricsBadge Component', () => {
    it('formats distance and duration correctly when metrics are present', () => {
      render(<RouteMetricsBadge distanceKm={265.4} durationMinutes={270} />);

      expect(screen.getByText('265.4 km')).toBeInTheDocument();
      expect(screen.getByText('~4 hr 30 min')).toBeInTheDocument();
      expect(screen.getByText(/OSRM Driving Estimate/i)).toBeInTheDocument();
    });

    it('displays fallback notice when metrics are null without throwing', () => {
      render(<RouteMetricsBadge distanceKm={null} durationMinutes={null} />);

      expect(
        screen.getByText(/Road distance & duration calculated after map pinpointing/i),
      ).toBeInTheDocument();
    });
  });

  describe('MapErrorBoundary Component', () => {
    it('catches render errors in map children and displays graceful fallback UI', () => {
      const ProblematicChild = () => {
        throw new Error('Leaflet canvas context failed');
      };

      // Suppress console.warn during deliberate error test
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <MapErrorBoundary fallbackText="Custom fallback: Map currently offline.">
          <ProblematicChild />
        </MapErrorBoundary>,
      );

      expect(screen.getByText('Custom fallback: Map currently offline.')).toBeInTheDocument();
      expect(
        screen.getByText(/Core ride details and bookings remain unaffected/i),
      ).toBeInTheDocument();

      warnSpy.mockRestore();
    });

    it('resets error state when resetKey changes', () => {
      let shouldThrow = true;
      const ProblematicChild = () => {
        if (shouldThrow) {
          throw new Error('Initial crash');
        }
        return <div>Recovered Map Content</div>;
      };

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { rerender } = render(
        <MapErrorBoundary resetKey="key-1" fallbackText="Map error fallback">
          <ProblematicChild />
        </MapErrorBoundary>,
      );

      expect(screen.getByText('Map error fallback')).toBeInTheDocument();

      // Now heal the child and change the resetKey
      shouldThrow = false;
      rerender(
        <MapErrorBoundary resetKey="key-2" fallbackText="Map error fallback">
          <ProblematicChild />
        </MapErrorBoundary>,
      );

      expect(screen.getByText('Recovered Map Content')).toBeInTheDocument();
      expect(screen.queryByText('Map error fallback')).not.toBeInTheDocument();

      warnSpy.mockRestore();
    });

    it('resets error state when user clicks Retry Map button', () => {
      let shouldThrow = true;
      const ProblematicChild = () => {
        if (shouldThrow) {
          throw new Error('Initial crash');
        }
        return <div>Recovered Map Content</div>;
      };

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <MapErrorBoundary fallbackText="Map error fallback">
          <ProblematicChild />
        </MapErrorBoundary>,
      );

      expect(screen.getByText('Map error fallback')).toBeInTheDocument();

      // Now heal the child and click Retry Map
      shouldThrow = false;
      fireEvent.click(screen.getByRole('button', { name: /Retry Map/i }));

      expect(screen.getByText('Recovered Map Content')).toBeInTheDocument();
      expect(screen.queryByText('Map error fallback')).not.toBeInTheDocument();

      warnSpy.mockRestore();
    });
  });

  describe('OSRM Routing Client (lib/osrm)', () => {
    it('handles network failure or non-200 responses gracefully by returning null without crashing', async () => {
      // Mock global fetch returning 503 Service Unavailable
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);

      const result = await fetchOsrmRoute(
        { lat: 21.1702, lng: 72.8311 },
        { lat: 23.0225, lng: 72.5714 },
      );

      expect(result).toBeNull();
    });

    it('rejects invalid or out-of-range coordinates immediately without making network calls', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      const result = await fetchOsrmRoute(
        { lat: 105.0, lng: 72.8311 }, // Invalid: lat > 90
        { lat: 23.0225, lng: 72.5714 },
      );

      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('OfferRidePage Map Integration', () => {
    it('seeds coordinates when a popular city is entered and submits with coordinates', async () => {
      vi.spyOn(apiClient, 'getVehicles').mockResolvedValue({ vehicles: [mockVehicle] });
      const createRideSpy = vi.spyOn(apiClient, 'createRide').mockResolvedValue({
        ride: mockGeoRide,
      });

      render(
        <MemoryRouter initialEntries={['/offer-ride']}>
          <AuthProvider>
            <Routes>
              <Route path="/offer-ride" element={<OfferRidePage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Origin City \/ Area/i)).toBeInTheDocument();
      });

      // Type Surat as origin (matches POPULAR_CITY_COORDINATES)
      const originInput = screen.getByLabelText(/Origin City \/ Area/i);
      fireEvent.change(originInput, { target: { value: 'Surat' } });

      // Type Ahmedabad as destination (matches POPULAR_CITY_COORDINATES)
      const destInput = screen.getByLabelText(/Destination City \/ Area/i);
      fireEvent.change(destInput, { target: { value: 'Ahmedabad' } });

      // Set travel date to tomorrow so departure is in the future
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const dateInput = screen.getByLabelText(/Travel Date/i);
      fireEvent.change(dateInput, { target: { value: tomorrow } });

      // Submit form
      const submitBtn = screen.getByRole('button', { name: /Publish Ride/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(createRideSpy).toHaveBeenCalledTimes(1);
      });

      const submittedPayload = createRideSpy.mock.calls[0][0];
      expect(submittedPayload.origin).toBe('Surat');
      expect(submittedPayload.destination).toBe('Ahmedabad');
      expect(submittedPayload.pickupLat).toBeCloseTo(21.1702, 3);
      expect(submittedPayload.dropoffLat).toBeCloseTo(23.0225, 3);
    });

    it('displays approximate city center notice when hub coordinates are auto-seeded', async () => {
      vi.spyOn(apiClient, 'getVehicles').mockResolvedValue({ vehicles: [mockVehicle] });

      render(
        <MemoryRouter initialEntries={['/offer-ride']}>
          <AuthProvider>
            <Routes>
              <Route path="/offer-ride" element={<OfferRidePage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Origin City \/ Area/i)).toBeInTheDocument();
      });

      const originInput = screen.getByLabelText(/Origin City \/ Area/i);
      fireEvent.change(originInput, { target: { value: 'Surat' } });

      expect(
        screen.getByText(/Approximate city center — adjust the pin for your exact location/i),
      ).toBeInTheDocument();
    });

    it('clears pickup coordinates when city is changed to an unrecognized custom address (city -> custom)', async () => {
      vi.spyOn(apiClient, 'getVehicles').mockResolvedValue({ vehicles: [mockVehicle] });
      const createRideSpy = vi.spyOn(apiClient, 'createRide').mockResolvedValue({
        ride: mockGeoRide,
      });

      render(
        <MemoryRouter initialEntries={['/offer-ride']}>
          <AuthProvider>
            <Routes>
              <Route path="/offer-ride" element={<OfferRidePage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Origin City \/ Area/i)).toBeInTheDocument();
      });

      const originInput = screen.getByLabelText(/Origin City \/ Area/i);
      const destInput = screen.getByLabelText(/Destination City \/ Area/i);

      // 1. Enter Surat -> seeds approximate coordinates
      fireEvent.change(originInput, { target: { value: 'Surat' } });
      fireEvent.change(destInput, { target: { value: 'Ahmedabad' } });

      // 2. Change origin to custom unrecognized location (e.g. "Saputara Hill Station")
      fireEvent.change(originInput, { target: { value: 'Saputara Hill Station' } });

      // 3. Submit
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const dateInput = screen.getByLabelText(/Travel Date/i);
      fireEvent.change(dateInput, { target: { value: tomorrow } });

      const submitBtn = screen.getByRole('button', { name: /Publish Ride/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(createRideSpy).toHaveBeenCalledTimes(1);
      });

      const submittedPayload = createRideSpy.mock.calls[0][0];
      expect(submittedPayload.origin).toBe('Saputara Hill Station');
      // Stale Surat coordinates must be cleared (undefined)
      expect(submittedPayload.pickupLat).toBeUndefined();
      expect(submittedPayload.pickupLng).toBeUndefined();
      // Dropoff was kept as Ahmedabad
      expect(submittedPayload.dropoffLat).toBeCloseTo(23.0225, 3);
    });

    it('clears pickup coordinates when city text is cleared to empty (city -> empty)', async () => {
      vi.spyOn(apiClient, 'getVehicles').mockResolvedValue({ vehicles: [mockVehicle] });
      const createRideSpy = vi.spyOn(apiClient, 'createRide').mockResolvedValue({
        ride: mockGeoRide,
      });

      render(
        <MemoryRouter initialEntries={['/offer-ride']}>
          <AuthProvider>
            <Routes>
              <Route path="/offer-ride" element={<OfferRidePage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Origin City \/ Area/i)).toBeInTheDocument();
      });

      const originInput = screen.getByLabelText(/Origin City \/ Area/i);
      const destInput = screen.getByLabelText(/Destination City \/ Area/i);

      // Enter Surat
      fireEvent.change(originInput, { target: { value: 'Surat' } });
      fireEvent.change(destInput, { target: { value: 'Ahmedabad' } });

      // Clear originInput
      fireEvent.change(originInput, { target: { value: '' } });

      // Re-enter unlisted origin
      fireEvent.change(originInput, { target: { value: 'Dumas Beach Road' } });

      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const dateInput = screen.getByLabelText(/Travel Date/i);
      fireEvent.change(dateInput, { target: { value: tomorrow } });

      const submitBtn = screen.getByRole('button', { name: /Publish Ride/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(createRideSpy).toHaveBeenCalledTimes(1);
      });

      const submittedPayload = createRideSpy.mock.calls[0][0];
      expect(submittedPayload.origin).toBe('Dumas Beach Road');
      expect(submittedPayload.pickupLat).toBeUndefined();
      expect(submittedPayload.pickupLng).toBeUndefined();
    });
  });

  describe('RideDetailsPage Map & Backward Compatibility', () => {
    it('renders route details with coordinates and road metrics', async () => {
      vi.spyOn(apiClient, 'getRideById').mockResolvedValue({ ride: mockGeoRide });
      vi.spyOn(apiClient, 'getPassengerBookings').mockResolvedValue({ bookings: [] });

      render(
        <MemoryRouter initialEntries={['/rides/ride-geo-1']}>
          <AuthProvider>
            <Routes>
              <Route path="/rides/:id" element={<RideDetailsPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Surat')).toBeInTheDocument();
        expect(screen.getByText('Ahmedabad')).toBeInTheDocument();
      });

      // Check distance metric chip is rendered
      expect(screen.getByText('265.4 km')).toBeInTheDocument();
      expect(screen.getByText(/Interactive Route Map/i)).toBeInTheDocument();
    });

    it('renders legacy rides without coordinates cleanly without crashing or throwing errors', async () => {
      vi.spyOn(apiClient, 'getRideById').mockResolvedValue({ ride: mockLegacyRide });
      vi.spyOn(apiClient, 'getPassengerBookings').mockResolvedValue({ bookings: [] });

      render(
        <MemoryRouter initialEntries={['/rides/ride-legacy-1']}>
          <AuthProvider>
            <Routes>
              <Route path="/rides/:id" element={<RideDetailsPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Surat')).toBeInTheDocument();
        expect(screen.getByText('Ahmedabad')).toBeInTheDocument();
      });

      // Core landmark information remains completely accessible
      expect(screen.getByText('Adajan Star Bazaar')).toBeInTheDocument();
      expect(screen.getByText('SG Highway Iscon')).toBeInTheDocument();
    });
  });

  describe('RouteMap Leaflet Lifecycle & StrictMode Regression', () => {
    it('mounts cleanly inside React.StrictMode without throwing "Map container is already initialized"', () => {
      expect(() => {
        render(
          <React.StrictMode>
            <RouteMap
              origin={{ lat: 21.1702, lng: 72.8311, label: 'Surat' }}
              destination={{ lat: 23.0225, lng: 72.5714, label: 'Ahmedabad' }}
            />
          </React.StrictMode>,
        );
      }).not.toThrow();

      expect(screen.getByText('OpenStreetMap')).toBeInTheDocument();
    });

    it('handles multiple unmount and remount cycles cleanly', () => {
      const { unmount } = render(
        <RouteMap
          origin={{ lat: 21.1702, lng: 72.8311, label: 'Surat' }}
          destination={{ lat: 23.0225, lng: 72.5714, label: 'Ahmedabad' }}
        />,
      );

      // Unmount the first instance
      expect(() => unmount()).not.toThrow();

      // Remount a second instance
      expect(() => {
        render(
          <RouteMap
            origin={{ lat: 19.076, lng: 72.8777, label: 'Mumbai' }}
            destination={{ lat: 18.5204, lng: 73.8567, label: 'Pune' }}
          />,
        );
      }).not.toThrow();

      expect(screen.getByText('OpenStreetMap')).toBeInTheDocument();
    });
  });
});

