import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

describe('RideMitra Web Application Shell', () => {
  beforeEach(() => {
    // Reset route to root
    window.history.pushState({}, '', '/');

    // Mock global fetch for HealthStatusBadge and api requests
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (typeof url === 'string' && url.includes('/api/v1/rides')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: {
                items: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
              },
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              status: 'ok',
              service: 'ridemitra-api',
              version: '0.1.0',
              timestamp: new Date().toISOString(),
              uptimeSeconds: 42,
              environment: 'test',
            },
          }),
        };
      }),
    );
  });

  const renderApp = async () => {
    const utils = render(<App />);
    await screen.findByText(/API Online/i);
    return utils;
  };

  it('renders the brand title and main navigation elements', async () => {
    await renderApp();
    const brandElements = screen.getAllByText(/Ride/i);
    expect(brandElements.length).toBeGreaterThan(0);
    const mitraElements = screen.getAllByText(/Mitra/i);
    expect(mitraElements.length).toBeGreaterThan(0);

    const offerRideButtons = screen.getAllByText(/Offer a Ride/i);
    expect(offerRideButtons.length).toBeGreaterThan(0);
  });

  it('renders the search form with accessible inputs and vehicle modes', async () => {
    await renderApp();

    expect(screen.getByLabelText(/From \(Source\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/To \(Destination\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of Travel/i)).toBeInTheDocument();

    expect(screen.getByText(/All Modes/i)).toBeInTheDocument();
    expect(screen.getByText(/Carpool Only/i)).toBeInTheDocument();
    expect(screen.getByText(/Bikepool Only/i)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Find Rides/i })).toBeInTheDocument();
  });

  it('displays a validation error when submitting with empty source/destination', async () => {
    await renderApp();

    const submitBtn = screen.getByRole('button', { name: /Find Rides/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Please enter a departure source location or city/i),
    ).toBeInTheDocument();
  });

  it('captures search input and navigates to ride discovery results upon valid submission', async () => {
    await renderApp();

    const sourceInput = screen.getByLabelText(/From \(Source\)/i);
    const destInput = screen.getByLabelText(/To \(Destination\)/i);
    const submitBtn = screen.getByRole('button', { name: /Find Rides/i });

    fireEvent.change(sourceInput, { target: { value: 'Surat' } });
    fireEvent.change(destInput, { target: { value: 'Ahmedabad' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Discover Shared Rides/i)).toBeInTheDocument();
    });
  });

  it('renders city commuting and intercity regional sections', async () => {
    await renderApp();

    expect(
      screen.getByText(/City Commuting for Daily Office & College Travel/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Comfortable Intercity Highway Carpooling/i)).toBeInTheDocument();
    expect(screen.getByText(/Surat: Vesu ⇄ Adajan \/ Ring Road/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Ahmedabad/i).length).toBeGreaterThan(0);
  });
});
