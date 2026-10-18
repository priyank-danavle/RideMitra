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
  Ticket,
  CheckCircle2,
  X,
  Minus,
  Plus,
  Navigation,
} from 'lucide-react';
import { apiClient, ApiError } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import type { Ride, Booking } from '@ridemitra/shared';
import { POPULAR_CITY_COORDINATES } from '@ridemitra/shared';
import { RouteMap } from '../components/maps/RouteMap';
import { RouteMetricsBadge } from '../components/maps/RouteMetricsBadge';
import { MapErrorBoundary } from '../components/maps/MapErrorBoundary';
import { fetchOsrmRoute } from '../lib/osrm';

export const RideDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();

  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [osrmPolyline, setOsrmPolyline] = useState<[number, number][] | null>(null);

  // Booking state
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null);
  const [seatsRequested, setSeatsRequested] = useState<number>(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadRide() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.getRideById(id);
        if (isMounted) {
          setRide(res.ride);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to retrieve ride details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadRide();
    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    async function checkPassengerBooking() {
      if (!id || !isAuthenticated) {
        setExistingBooking(null);
        return;
      }
      try {
        const bookingsRes = await apiClient.getPassengerBookings();
        if (isMounted) {
          const existing = bookingsRes.bookings.find(
            (b) => b.rideId === id && b.status !== 'CANCELLED' && b.status !== 'REJECTED',
          );
          setExistingBooking(existing || null);
        }
      } catch {
        // Non-critical background booking check
      }
    }
    checkPassengerBooking();
    return () => {
      isMounted = false;
    };
  }, [id, isAuthenticated]);

  // Helper to match city name against known corridor coordinates
  const resolveCityCoordinates = (cityName: string): { lat: number; lng: number } | null => {
    const clean = cityName.trim().toLowerCase();
    for (const [key, coords] of Object.entries(POPULAR_CITY_COORDINATES)) {
      if (
        clean === key.toLowerCase() ||
        clean.startsWith(key.toLowerCase()) ||
        clean.includes(key.toLowerCase())
      ) {
        return coords;
      }
    }
    return null;
  };

  // Derive pickup and drop-off coordinates (explicit stored coordinates or known transit hub fallback)
  const pickupCoords = React.useMemo(() => {
    if (!ride) return null;
    if (
      ride.pickupLat !== null &&
      ride.pickupLat !== undefined &&
      ride.pickupLng !== null &&
      ride.pickupLng !== undefined
    ) {
      return { lat: Number(ride.pickupLat), lng: Number(ride.pickupLng) };
    }
    return resolveCityCoordinates(ride.origin);
  }, [ride]);

  const dropoffCoords = React.useMemo(() => {
    if (!ride) return null;
    if (
      ride.dropoffLat !== null &&
      ride.dropoffLat !== undefined &&
      ride.dropoffLng !== null &&
      ride.dropoffLng !== undefined
    ) {
      return { lat: Number(ride.dropoffLat), lng: Number(ride.dropoffLng) };
    }
    return resolveCityCoordinates(ride.destination);
  }, [ride]);

  const isPickupApproximate = React.useMemo(() => {
    if (!pickupCoords) return false;
    return Object.values(POPULAR_CITY_COORDINATES).some(
      (c) => Math.abs(c.lat - pickupCoords.lat) < 0.0001 && Math.abs(c.lng - pickupCoords.lng) < 0.0001,
    );
  }, [pickupCoords]);

  const isDropoffApproximate = React.useMemo(() => {
    if (!dropoffCoords) return false;
    return Object.values(POPULAR_CITY_COORDINATES).some(
      (c) => Math.abs(c.lat - dropoffCoords.lat) < 0.0001 && Math.abs(c.lng - dropoffCoords.lng) < 0.0001,
    );
  }, [dropoffCoords]);

  // Fetch OSRM polyline for smooth road corridor rendering
  useEffect(() => {
    if (!pickupCoords || !dropoffCoords) {
      setOsrmPolyline(null);
      return;
    }

    let isMounted = true;
    async function fetchPolyline() {
      try {
        const res = await fetchOsrmRoute(pickupCoords!, dropoffCoords!);
        if (isMounted && res) {
          setOsrmPolyline(res.polylineCoordinates);
        }
      } catch {
        if (isMounted) setOsrmPolyline(null);
      }
    }

    fetchPolyline();
    return () => {
      isMounted = false;
    };
  }, [pickupCoords?.lat, pickupCoords?.lng, dropoffCoords?.lat, dropoffCoords?.lng]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ride || !isAuthenticated) return;
    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const res = await apiClient.createBooking({
        rideId: ride.id,
        seatsBooked: seatsRequested,
      });
      setExistingBooking(res.booking);
      setBookingSuccess(
        `Booking request for ${res.booking.seatsBooked} seat(s) submitted! The driver will review your request.`,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setBookingError(err.message);
      } else {
        setBookingError('Failed to submit booking request. Please check seat availability.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

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
  const isBike = ride.vehicle?.type === 'BIKE';
  const departureDate = new Date(ride.departureTime);
  const isPast = departureDate.getTime() < Date.now();
  const isScheduled = ride.status === 'SCHEDULED' && !isPast;
  const isFull = ride.availableSeats <= 0;
  const maxSeatsForBooking = isBike ? 1 : Math.min(ride.availableSeats, 6);

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

  const totalPricePreview = (ride.pricePerSeat || 0) * seatsRequested;

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
                isScheduled
                  ? 'badge-success'
                  : ride.status === 'CANCELLED'
                    ? 'badge-error'
                    : 'badge-outline'
              }`}
              style={{ fontSize: '0.9rem', padding: '0.35rem 0.75rem', fontWeight: 700 }}
            >
              {isScheduled && 'Scheduled & Open'}
              {ride.status === 'CANCELLED' && 'Cancelled'}
              {ride.status === 'COMPLETED' && 'Trip Completed'}
              {ride.status === 'ACTIVE' && 'Trip In Progress'}
              {ride.status === 'SCHEDULED' && isPast && 'Past Departure'}
            </span>
            <span className={`badge ${ride.type === 'CITY' ? 'badge-city' : 'badge-intercity'}`}>
              {ride.type === 'CITY' ? 'City Commute' : 'Intercity Travel'}
            </span>
            <span className={`badge ${isBike ? 'badge-bike' : 'badge-car'}`}>
              {isBike ? (
                <>
                  <Bike size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Bikepool
                </>
              ) : (
                <>
                  <Car size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Carpool
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

          {/* Phase 5.3: Interactive Route Map & Distance Metrics */}
          {(pickupCoords || dropoffCoords) && (
            <div style={{ marginTop: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Navigation size={16} style={{ color: 'var(--color-primary)' }} />
                  Interactive Route Map (OpenStreetMap & OSRM)
                </span>

                <RouteMetricsBadge
                  distanceKm={ride.distanceKm}
                  durationMinutes={ride.durationMinutes}
                />
              </div>

              <MapErrorBoundary
                resetKey={ride.id}
                fallbackText="Route map preview temporarily unavailable. All booking actions remain active."
              >
                <RouteMap
                  origin={
                    pickupCoords
                      ? {
                          lat: pickupCoords.lat,
                          lng: pickupCoords.lng,
                          label: ride.pickupPoint || ride.origin,
                          isApproximate: isPickupApproximate,
                        }
                      : null
                  }
                  destination={
                    dropoffCoords
                      ? {
                          lat: dropoffCoords.lat,
                          lng: dropoffCoords.lng,
                          label: ride.dropoffPoint || ride.destination,
                          isApproximate: isDropoffApproximate,
                        }
                      : null
                  }
                  polyline={osrmPolyline}
                  editable={false}
                  height="280px"
                />
              </MapErrorBoundary>

              {(isPickupApproximate || isDropoffApproximate) && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md, 8px)',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>ℹ️</span>
                  <span>
                    Approximate city center — please coordinate with the driver for your exact pickup and drop-off spot.
                  </span>
                </div>
              )}
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
                  color: ride.availableSeats > 0 ? 'var(--color-success)' : 'var(--color-error)',
                }}
              >
                {ride.availableSeats > 0
                  ? `${ride.availableSeats} Seats Available`
                  : 'Fully Booked'}
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
              {isBike ? (
                <Bike size={18} style={{ color: 'var(--color-primary)' }} />
              ) : (
                <Car size={18} style={{ color: 'var(--color-primary)' }} />
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
                    {isBike ? 'Motorcycle / Scooter' : 'Carpool Car'}
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

        {/* =========================================================================
            PHASE 4: INTERACTIVE BOOKING ENGINE & STATUS
           ========================================================================= */}
        {bookingSuccess && (
          <div
            className="card"
            style={{
              backgroundColor: '#ecfdf5',
              borderColor: '#a7f3d0',
              color: '#065f46',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <CheckCircle2 size={20} />
            <span style={{ fontWeight: 600 }}>{bookingSuccess}</span>
          </div>
        )}

        {isOwner ? (
          /* Driver View */
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
                  style={{ fontWeight: 700, color: 'var(--color-primary-dark)', fontSize: '1rem' }}
                >
                  You are the driver of this ride
                </div>
                <div
                  style={{ fontSize: '0.85rem', color: 'var(--color-primary-dark)', opacity: 0.9 }}
                >
                  Manage incoming passenger booking requests, seat assignments, or trip updates in
                  My Rides.
                </div>
              </div>
            </div>

            <Link
              to="/my-rides"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Manage in My Rides <ArrowRight size={16} />
            </Link>
          </div>
        ) : !isAuthenticated ? (
          /* Unauthenticated Prompt */
          <div
            style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary-dark)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Ticket size={24} />
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Want to Join This Ride?</h2>
            <p
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.95rem',
                maxWidth: '480px',
                marginInline: 'auto',
                marginBottom: '1.5rem',
              }}
            >
              Sign in or create an account to request seat reservations, coordinate pickup points,
              and connect with verified commuters.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <Link to={`/login?redirect=/rides/${ride.id}`} className="btn btn-primary">
                Sign In to Reserve Seats
              </Link>
              <Link to="/register" className="btn btn-outline">
                Create Account
              </Link>
            </div>
          </div>
        ) : existingBooking ? (
          /* User already booked */
          <div
            className="card"
            style={{
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-primary)',
              backgroundColor: 'var(--color-primary-light)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <CheckCircle2 size={24} style={{ color: 'var(--color-primary-dark)' }} />
                <div>
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: 'var(--color-primary-dark)',
                    }}
                  >
                    Your Reservation is Active
                  </h3>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-primary-dark)',
                      opacity: 0.9,
                    }}
                  >
                    Status:{' '}
                    <strong>
                      {existingBooking.status === 'PENDING'
                        ? 'Pending Driver Approval'
                        : existingBooking.status === 'CONFIRMED'
                          ? 'Confirmed & Seats Held'
                          : existingBooking.status}
                    </strong>
                  </div>
                </div>
              </div>

              <span
                className={`badge ${
                  existingBooking.status === 'CONFIRMED' ? 'badge-success' : 'badge-outline'
                }`}
                style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem', fontWeight: 700 }}
              >
                {existingBooking.status}
              </span>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  SEATS RESERVED
                </span>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                  {existingBooking.seatsBooked}{' '}
                  {existingBooking.seatsBooked === 1 ? 'Seat' : 'Seats'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  TOTAL FARE
                </span>
                <div
                  style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-primary)' }}
                >
                  ₹{existingBooking.totalPrice}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Link
                to="/my-bookings"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Ticket size={16} /> View in My Bookings
              </Link>
            </div>
          </div>
        ) : !isScheduled ? (
          /* Ride Ineligible for booking */
          <div
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <AlertCircle size={22} style={{ color: 'var(--color-text-muted)' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Ride Closed for Booking</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                This ride has either departed or been cancelled and cannot accept new passenger
                reservations.
              </div>
            </div>
          </div>
        ) : isFull ? (
          /* Ride is Full */
          <div
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <AlertCircle size={22} style={{ color: '#dc2626' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#991b1b' }}>
                All Seats Full
              </div>
              <div style={{ fontSize: '0.85rem', color: '#991b1b' }}>
                All offered seats on this corridor are currently occupied. Check back later in case
                a passenger cancels.
              </div>
            </div>
          </div>
        ) : (
          /* Active Interactive Booking Form */
          <div
            className="card"
            style={{
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              boxShadow: 'var(--shadow-sm)',
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
              <Ticket size={20} style={{ color: 'var(--color-primary)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Reserve Passenger Seats</h2>
            </div>

            {/* Success alert */}
            {bookingSuccess && (
              <div
                className="card"
                style={{
                  backgroundColor: '#ecfdf5',
                  borderColor: '#a7f3d0',
                  color: '#065f46',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle2 size={18} />
                <span>{bookingSuccess}</span>
              </div>
            )}

            {/* Error alert */}
            {bookingError && (
              <div
                className="card"
                role="alert"
                style={{
                  backgroundColor: '#fef2f2',
                  borderColor: '#fecaca',
                  color: '#991b1b',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} />
                  <span>{bookingError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingError(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#991b1b',
                  }}
                  aria-label="Dismiss error"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <form onSubmit={handleBookingSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Seat Selector Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--color-surface-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <label
                      htmlFor="seatSelector"
                      style={{ fontWeight: 700, fontSize: '0.95rem', display: 'block' }}
                    >
                      Number of Seats Requested
                    </label>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {ride.availableSeats} of {ride.totalSeats} seats currently remaining
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      type="button"
                      aria-label="Decrease seats"
                      disabled={seatsRequested <= 1 || bookingLoading}
                      onClick={() => setSeatsRequested((prev) => Math.max(1, prev - 1))}
                      className="btn btn-outline"
                      style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%' }}
                    >
                      <Minus size={16} />
                    </button>

                    <span
                      id="seatSelector"
                      style={{
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        minWidth: '32px',
                        textAlign: 'center',
                        color: 'var(--color-text)',
                      }}
                    >
                      {seatsRequested}
                    </span>

                    <button
                      type="button"
                      aria-label="Increase seats"
                      disabled={seatsRequested >= maxSeatsForBooking || bookingLoading}
                      onClick={() =>
                        setSeatsRequested((prev) => Math.min(maxSeatsForBooking, prev + 1))
                      }
                      className="btn btn-outline"
                      style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%' }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Price Breakdown Calculation */}
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span style={{ color: 'var(--color-text-muted)' }}>Fare per Seat:</span>
                    <span style={{ fontWeight: 600 }}>₹{ride.pricePerSeat || 0}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.9rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <span style={{ color: 'var(--color-text-muted)' }}>Requested Seats:</span>
                    <span style={{ fontWeight: 600 }}>× {seatsRequested}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    <span>Estimated Total Fare:</span>
                    <span style={{ color: 'var(--color-primary)' }}>₹{totalPricePreview}</span>
                  </div>
                </div>

                {/* Information Notice */}
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  <strong>Seat Allocation Policy:</strong> Your seats are officially reserved upon
                  driver confirmation. Fares are calculated authoritatively by the server and
                  settled between passenger and driver.
                </p>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={bookingLoading || ride.availableSeats <= 0}
                  className="btn btn-primary"
                  style={{
                    padding: '0.85rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Ticket size={18} />
                  <span>
                    {bookingLoading ? 'Submitting Request...' : 'Request Seat Reservation'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};
