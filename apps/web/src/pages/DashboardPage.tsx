import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  PlusCircle,
  Search,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
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
            gap: '1.5rem',
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
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <User size={14} /> {user?.role} Account
              </span>
              <span
                className="badge"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Sparkles size={14} /> Phase 3 Active
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
              Publish verified carpools and bikepools, explore commuter routes, or manage your
              scheduled trips.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to="/offer-ride"
              className="btn"
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--color-primary-dark)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <PlusCircle size={18} /> Offer a Ride
            </Link>
            <Link
              to="/rides"
              className="btn"
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Search size={18} /> Find Rides
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
        {/* Offer a Ride Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary-dark)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlusCircle size={24} />
            </div>
            <span className="badge badge-primary">Driver Action</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Offer a Ride</h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.9rem',
              marginBottom: '1.25rem',
            }}
          >
            {vehicles.length === 0
              ? 'Register a vehicle first to publish your carpool or bikepool route.'
              : 'Publish city or intercity rides with departure times and available seats.'}
          </p>
          <Link
            to={vehicles.length === 0 ? '/vehicles' : '/offer-ride'}
            className="btn btn-primary btn-sm"
            style={{
              marginTop: 'auto',
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            {vehicles.length === 0 ? 'Register Vehicle First' : 'Publish Ride'}
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* My Rides Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-subtle)',
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={24} />
            </div>
            <span className="badge badge-outline">Management</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>My Offered Rides</h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.9rem',
              marginBottom: '1.25rem',
            }}
          >
            Review upcoming schedules, manage passenger seats, or cancel offered rides.
          </p>
          <Link
            to="/my-rides"
            className="btn btn-outline btn-sm"
            style={{
              marginTop: 'auto',
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            Manage My Rides <ArrowRight size={14} />
          </Link>
        </div>

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
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-subtle)',
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Car size={24} />
            </div>
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
            style={{
              marginTop: 'auto',
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            Manage Vehicles <ArrowRight size={14} />
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
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-subtle)',
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={24} />
            </div>
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
            style={{
              marginTop: 'auto',
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            View & Edit Profile <ArrowRight size={14} />
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
          <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ fontSize: '1.1rem' }}>Engineering Milestone: Phase 3 Active</h3>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          RideMitra now supports end-to-end <strong>Ride Management & Discovery</strong>. Drivers
          with registered vehicles can publish upcoming routes with seat counts and pricing, while
          commuters can filter, sort, and discover rides with MySQL-indexed queries and clean
          responsive UI.
        </p>
      </div>
    </div>
  );
};
