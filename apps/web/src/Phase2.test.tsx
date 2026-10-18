import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { VehiclesPage } from './pages/VehiclesPage';
import { apiClient } from './lib/apiClient';
import type { UserSafeProfile, Vehicle } from '@ridemitra/shared';

const mockUser: UserSafeProfile = {
  id: 'usr_test_123',
  name: 'Aarav Patel',
  email: 'aarav@example.com',
  phone: '+919876543210',
  bio: 'Commuter between Surat and Ahmedabad',
  role: 'USER',
  isEmailVerified: true,
  isPhoneVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockVehicle: Vehicle = {
  id: 'veh_test_123',
  userId: 'usr_test_123',
  type: 'CAR',
  make: 'Maruti Suzuki',
  model: 'Swift',
  year: 2022,
  color: 'Pearl White',
  registrationNumber: 'GJ-05-AB-1234',
  capacity: 4,
  isVerified: false,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('Phase 2 Frontend Authentication & Vehicle Management UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Default mock for getMe
    vi.spyOn(apiClient, 'getMe').mockResolvedValue({ user: mockUser });
    vi.spyOn(apiClient, 'getVehicles').mockResolvedValue({ vehicles: [mockVehicle] });
  });

  it('LoginPage renders fields and validates empty inputs', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(
      await screen.findByText(/Please provide both your email address and password/i),
    ).toBeInTheDocument();
  });

  it('LoginPage handles successful login submission', async () => {
    const loginSpy = vi.spyOn(apiClient, 'login').mockResolvedValue({ user: mockUser });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>Mock Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'aarav@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'SecretPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        email: 'aarav@example.com',
        password: 'SecretPassword123!',
      });
      expect(screen.getByText('Mock Dashboard')).toBeInTheDocument();
    });
  });

  it('RegisterPage validates password confirmation and submits successfully', async () => {
    const registerSpy = vi.spyOn(apiClient, 'register').mockResolvedValue({ user: mockUser });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <AuthProvider>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<div>Mock Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Aarav Patel' },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'aarav@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'DifferentPassword!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();

    // Fix password
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith({
        name: 'Aarav Patel',
        email: 'aarav@example.com',
        password: 'Password123!',
      });
      expect(screen.getByText('Mock Dashboard')).toBeInTheDocument();
    });
  });

  it('ProfilePage displays user details and allows editing', async () => {
    const updateSpy = vi.spyOn(apiClient, 'updateProfile').mockResolvedValue({
      user: { ...mockUser, name: 'Aarav K. Patel', bio: 'Updated bio' },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    // Initial view
    await waitFor(() => {
      expect(screen.getByDisplayValue('Aarav Patel')).toBeInTheDocument();
      expect(screen.getByDisplayValue('aarav@example.com')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /Edit Profile/i }));

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: 'Aarav K. Patel' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'Aarav K. Patel' }));
      expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
    });
  });

  it('VehiclesPage renders registered vehicles and opens registration modal', async () => {
    const createSpy = vi.spyOn(apiClient, 'createVehicle').mockResolvedValue({
      vehicle: {
        ...mockVehicle,
        id: 'veh_bike_456',
        type: 'BIKE',
        make: 'Royal Enfield',
        model: 'Hunter 350',
        capacity: 1,
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <VehiclesPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    // Initial vehicle displayed
    expect(await screen.findByText('Maruti Suzuki Swift')).toBeInTheDocument();
    expect(screen.getByText('GJ-05-AB-1234')).toBeInTheDocument();
    expect(screen.getByText(/Unverified/i)).toBeInTheDocument();

    // Click Add New Vehicle
    fireEvent.click(screen.getByRole('button', { name: /\+ Add New Vehicle/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Switch to Bikepool
    fireEvent.click(screen.getByText(/Bikepool/i));
    const capacityInput = screen.getByLabelText(/Passenger Seats/i) as HTMLInputElement;
    expect(capacityInput.value).toBe('1');
    expect(capacityInput).toBeDisabled(); // Bike capacity is locked to 1

    // Fill form
    fireEvent.change(screen.getByLabelText(/Make \/ Brand/i), {
      target: { value: 'Royal Enfield' },
    });
    fireEvent.change(screen.getByLabelText(/Model Name/i), {
      target: { value: 'Hunter 350' },
    });
    fireEvent.change(screen.getByLabelText(/Color/i), {
      target: { value: 'Dapper Ash' },
    });
    fireEvent.change(screen.getByLabelText(/Plate Number/i), {
      target: { value: 'GJ-05-RE-3500' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^Register Vehicle$/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BIKE',
          make: 'Royal Enfield',
          model: 'Hunter 350',
          registrationNumber: 'GJ-05-RE-3500',
          capacity: 1,
        }),
      );
    });
  });
});
