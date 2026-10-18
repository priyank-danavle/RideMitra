import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Car,
  Bike,
  ShieldCheck,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileText,
  Users,
  Info,
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import type { Ride } from '@ridemitra/shared';

export const RideDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRide() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.getRideById(id);
        setRide(res.ride);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to retrieve ride details.');
      } finally {
        setLoading(false);
      }
    }
    loadRide();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ paddingBlock: '3rem 4rem', maxWidth: '800px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="skeleton" style={{ width: '120px', height: '36px' }} />
          <div className="card" style={{ padding: '2rem' }}>
            <div
              className="skeleton"
              style={{ width: '50%', height: '32px', marginBottom: '1rem' }}
            />
            <div
              className="skeleton"
              style={{ width: '80%', height: '24px', marginBottom: '1.5rem' }}
            />
            <div className="skeleton" style={{ width: '100%', height: '120px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div
        className="container"
        style={{ paddingBlock: '4rem', maxWidth: '600px', textAlign: 'center' }}
      >
        <div
          className="card"
          style={{
            padding: '3rem 2rem',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Ride Not Found</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.75rem' }}>
            {error || 'The requested ride could not be located or may have been deleted.'}
          </p>
          <Link
            to="/rides"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={16} /> Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user && user.id === ride.driverId;
  const isAvailable = ride.status === 'SCHEDULED' && ride.availableSeats > 0;
  const departureDate = new Date(ride.departureTime);
  const formattedDate = departureDate.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = departureDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="container" style={{ paddingBlock: '2.5rem 4rem', maxWidth: '840px' }}>
      {/* Back navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/rides"
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} /> Back to Rides
        </Link>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="card"
        style={{
          padding: '2.5rem',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          marginBottom: '2rem',
        }}
      >
        {/* Status Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span
              className={`badge ${
                ride.status === 'SCHEDULED'
                  ? 'badge-success'
                  : ride.status === 'CANCELLED'
                    ? 'badge-error'
                    : 'badge-outline'
              }`}
              style={{ fontSize: '0.9rem', padding: '0.35rem 0.75rem', fontWeight: 700 }}
            >
              {ride.status === 'SCHEDULED' && 'Scheduled & Open'}
              {ride.status === 'CANCELLED' && 'Cancelled'}
              {ride.status === 'COMPLETED' && 'Trip Completed'}
              {ride.status === 'ACTIVE' && 'Trip In Progress'}
            </span>
            <span className={`badge ${ride.type === 'CITY' ? 'badge-city' : 'badge-intercity'}`}>
              {ride.type === 'CITY' ? 'City Commute' : 'Intercity Travel'}
            </span>
            <span className={`badge ${ride.vehicle?.type === 'CAR' ? 'badge-car' : 'badge-bike'}`}>
              {ride.vehicle?.type === 'CAR' ? (
                <>
                  <Car size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Carpool
                </>
              ) : (
                <>
                  <Bike size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Bikepool
                </>
              )}
            </span>
          </div>

          {/* Pricing Highlight */}
          <div>
            {ride.pricePerSeat ? (
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: 'var(--color-primary)',
                  }}
                >
                  ₹{ride.pricePerSeat}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {' '}
                  / passenger seat
                </span>
              </div>
            ) : (
              <span className="badge badge-success" style={{ fontSize: '0.9rem' }}>
                Free / Shared Fuel
              </span>
            )}
          </div>
        </div>

        {/* Route Corridor Hero */}
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: 'clamp(1.4rem, 3vw, 1.85rem)',
              fontWeight: 800,
              marginBottom: '0.75rem',
            }}
          >
            <span>{ride.origin}</span>
            <ArrowRight size={24} style={{ color: 'var(--color-primary)' }} />
            <span>{ride.destination}</span>
          </div>

          {(ride.pickupPoint || ride.dropoffPoint) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                marginTop: '1rem',
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--color-surface-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    display: 'block',
                  }}
                >
                  PICKUP LANDMARK
                </span>
                <span style={{ fontWeight: 600 }}>
                  {ride.pickupPoint || 'To be coordinated with driver'}
                </span>
              </div>
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    display: 'block',
                  }}
                >
                  DROP-OFF LANDMARK
                </span>
                <span style={{ fontWeight: 600 }}>
                  {ride.dropoffPoint || 'To be coordinated with driver'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Departure & Capacity Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          {/* Departure Card */}
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                DEPARTURE TIME
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '0.2rem' }}>
                {formattedTime}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {formattedDate}
              </div>
            </div>
          </div>

          {/* Seat Capacity Card */}
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                SEAT AVAILABILITY
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  marginTop: '0.2rem',
                  color: isAvailable ? 'var(--color-success)' : 'var(--color-error)',
                }}
              >
                {ride.availableSeats} Seats Available
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {ride.totalSeats} seats originally offered
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle & Driver Sections */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          {/* Vehicle Information */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              {ride.vehicle?.type === 'CAR' ? (
                <Car size={18} style={{ color: 'var(--color-primary)' }} />
              ) : (
                <Bike size={18} style={{ color: 'var(--color-primary)' }} />
              )}
              <h2 style={{ fontSize: '1.1rem' }}>Vehicle Information</h2>
            </div>

            {ride.vehicle ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>Model:</span>
                  <span style={{ fontWeight: 600 }}>
                    {ride.vehicle.make} {ride.vehicle.model}
                  </span>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>Type:</span>
                  <span style={{ fontWeight: 600 }}>
                    {ride.vehicle.type === 'CAR' ? 'Carpool Car' : 'Motorcycle / Scooter'}
                  </span>
                </div>
                {ride.vehicle.registrationNumber && (
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}
                  >
                    <span style={{ color: 'var(--color-text-muted)' }}>Plate:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {ride.vehicle.registrationNumber}
                    </span>
                  </div>
                )}
                {ride.vehicle.color && (
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}
                  >
                    <span style={{ color: 'var(--color-text-muted)' }}>Color:</span>
                    <span style={{ fontWeight: 600 }}>{ride.vehicle.color}</span>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                Vehicle details registered with driver.
              </p>
            )}
          </div>

          {/* Driver Public Profile */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <User size={18} style={{ color: 'var(--color-primary)' }} />
              <h2 style={{ fontSize: '1.1rem' }}>Driver Public Profile</h2>
            </div>

            {ride.driver ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.15rem',
                    }}
                  >
                    {ride.driver.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {ride.driver.name}
                      {ride.driver.isVerified && (
                        <span title="Verified Commuter" style={{ display: 'inline-flex' }}>
                          <ShieldCheck size={16} style={{ color: 'var(--color-primary)' }} />
                        </span>
                      )}
                    </div>
                    {ride.driver.createdAt && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Member since{' '}
                        {new Date(ride.driver.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {ride.driver.bio ? (
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.5,
                    }}
                  >
                    "{ride.driver.bio}"
                  </p>
                ) : (
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-text-muted)',
                      fontStyle: 'italic',
                    }}
                  >
                    Verified RideMitra commuter.
                  </p>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                Driver details unavailable.
              </p>
            )}
          </div>
        </div>

        {/* Ride Notes / Instructions */}
        {ride.description && (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                marginBottom: '0.5rem',
              }}
            >
              <FileText size={16} /> RIDE INSTRUCTIONS FROM DRIVER
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{ride.description}</p>
          </div>
        )}

        {/* Action & Roadmap Banner */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid var(--color-primary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Info size={24} style={{ color: 'var(--color-primary-dark)', flexShrink: 0 }} />
            <div>
              <div
                style={{ fontWeight: 700, color: 'var(--color-primary-dark)', fontSize: '0.95rem' }}
              >
                {isOwner ? 'You are the driver of this ride' : 'Phase 3: Ride Discovery Active'}
              </div>
              <div
                style={{ fontSize: '0.85rem', color: 'var(--color-primary-dark)', opacity: 0.9 }}
              >
                {isOwner
                  ? 'You can manage, edit eligible details, or cancel this ride from My Rides.'
                  : 'Passenger seat bookings and instant requests will be introduced in Phase 4.'}
              </div>
            </div>
          </div>

          {isOwner && (
            <Link
              to="/my-rides"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Manage in My Rides <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
};
