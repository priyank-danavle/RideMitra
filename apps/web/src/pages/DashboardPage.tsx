import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/apiClient';
import type { Vehicle } from '@ridemitra/shared';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVehicles() {
      try {
        const res = await apiClient.getVehicles();
        setVehicles(res.vehicles);
      } catch {
        // Handled silently
      } finally {
        setLoading(false);
      }
    }
    loadVehicles();
  }, []);

  return (
    <div className="container" style={{ paddingBlock: '3rem 4rem' }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #042f2e 0%, #0f766e 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          marginBottom: '2.5rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <span
                className="badge"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
              >
                👤 {user?.role} Account
              </span>
              <span
                className="badge"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
              >
                Phase 2 Active
              </span>
            </div>
            <h1
              style={{
                color: '#ffffff',
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                marginBottom: '0.5rem',
              }}
            >
              Welcome back, {user?.name}!
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', maxWidth: '600px' }}>
              Manage your verified profile, register your car or bike, and get ready to publish or
              book rides.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link
              to="/vehicles"
              className="btn"
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--color-primary-dark)',
                fontWeight: 600,
              }}
            >
              + Register Vehicle
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Action & Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem',
        }}
      >
        {/* Vehicles Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <span style={{ fontSize: '2rem' }}>🚗</span>
            <span className="badge badge-primary">
              {loading ? '...' : `${vehicles.length} Active`}
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>My Vehicles</h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.9rem',
              marginBottom: '1.25rem',
            }}
          >
            {vehicles.length === 0
              ? 'No vehicles registered yet. Register a car or bike to offer rides.'
              : `${vehicles.length} vehicle(s) registered under your account.`}
          </p>
          <Link
            to="/vehicles"
            className="btn btn-outline btn-sm"
            style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
          >
            Manage Vehicles →
          </Link>
        </div>

        {/* Profile Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <span style={{ fontSize: '2rem' }}>👤</span>
            <span className="badge badge-outline">Account</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Personal Profile</h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.9rem',
              marginBottom: '1.25rem',
            }}
          >
            {user?.phone
              ? `Phone: ${user.phone}`
              : 'Add your mobile number to build commuter trust.'}
          </p>
          <Link
            to="/profile"
            className="btn btn-outline btn-sm"
            style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
          >
            View & Edit Profile →
          </Link>
        </div>

        {/* Ride Discovery Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <span style={{ fontSize: '2rem' }}>🔍</span>
            <span className="badge badge-outline">Search</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Find a Ride</h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.9rem',
              marginBottom: '1.25rem',
            }}
          >
            Explore city and intercity commute corridors across Gujarat and nearby hubs.
          </p>
          <Link
            to="/"
            className="btn btn-outline btn-sm"
            style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
          >
            Search Rides →
          </Link>
        </div>
      </div>

      {/* Roadmap Context Callout */}
      <div
        style={{
          padding: '1.75rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-surface-subtle)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}
        >
          <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
          <h3 style={{ fontSize: '1.1rem' }}>Engineering Progress & Next Phase</h3>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          You are currently experiencing{' '}
          <strong>Phase 2 (Authentication, User Profiles & Vehicle Management)</strong>. Your
          account credentials and vehicle records are secured in the MySQL database. In{' '}
          <strong>Phase 3 (Ride Management & Search)</strong>, verified drivers will be able to
          publish upcoming rides with departure schedules and available seats.
        </p>
      </div>
    </div>
  );
};
