import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Car,
  Bike,
  Compass,
  ArrowRight,
  XCircle,
  AlertCircle,
  CheckCircle2,
  X,
  Ticket,
  User,
  ShieldCheck,
} from 'lucide-react';
import { apiClient, ApiError } from '../lib/apiClient';
import type { Booking } from '@ridemitra/shared';
import {
  staggerContainerVariants,
  staggerItemVariants,
  modalBackdropVariants,
  modalContentVariants,
} from '../lib/motion';

type TabType = 'ACTIVE' | 'PAST' | 'CANCELLED';

export const MyBookingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('ACTIVE');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cancellation Modal State
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.getPassengerBookings();
      setBookings(Array.isArray(res?.bookings) ? res.bookings : []);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to retrieve your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const now = new Date();

  // Categorize bookings
  const activeBookings = bookings.filter((b) => {
    const isPendingOrConfirmed = b.status === 'PENDING' || b.status === 'CONFIRMED';
    const depTime = b.ride?.departureTime ? new Date(b.ride.departureTime) : null;
    const isFuture = depTime ? depTime.getTime() > now.getTime() : true;
    return isPendingOrConfirmed && isFuture;
  });

  const pastBookings = bookings.filter((b) => {
    if (b.status === 'COMPLETED') return true;
    if (b.status === 'PENDING' || b.status === 'CONFIRMED') {
      const depTime = b.ride?.departureTime ? new Date(b.ride.departureTime) : null;
      return depTime ? depTime.getTime() <= now.getTime() : false;
    }
    return false;
  });

  const cancelledBookings = bookings.filter(
    (b) => b.status === 'CANCELLED' || b.status === 'REJECTED',
  );

  const displayedBookings =
    activeTab === 'ACTIVE'
      ? activeBookings
      : activeTab === 'PAST'
        ? pastBookings
        : cancelledBookings;

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setCancelling(true);
    setErrorMsg(null);
    try {
      await apiClient.cancelBooking(cancellingBooking.id);
      setActionSuccess('Booking cancelled successfully.');
      setCancellingBooking(null);
      await fetchBookings();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to cancel booking. Please try again.');
      }
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="container" style={{ paddingBlock: '2.5rem 4rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: 'var(--color-primary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              marginBottom: '0.25rem',
            }}
          >
            <Ticket size={18} />
            <span>Passenger Reservations</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800 }}>My Bookings</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
            Track and manage your requested and confirmed carpool & bikepool journeys
          </p>
        </div>

        <Link
          to="/rides"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Compass size={17} />
          Find More Rides
        </Link>
      </div>

      {/* Success banner */}
      {actionSuccess && (
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
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error banner */}
      {errorMsg && (
        <div
          className="card"
          style={{
            backgroundColor: '#fef2f2',
            borderColor: '#fecaca',
            color: '#991b1b',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '2rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.95rem',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'ACTIVE' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'ACTIVE' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>Active & Upcoming</span>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              backgroundColor:
                activeTab === 'ACTIVE'
                  ? 'var(--color-primary-light)'
                  : 'var(--color-surface-subtle)',
              color:
                activeTab === 'ACTIVE' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
            }}
          >
            {activeBookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PAST')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.95rem',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'PAST' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'PAST' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>Past Trips</span>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              backgroundColor: 'var(--color-surface-subtle)',
              color: 'var(--color-text-muted)',
            }}
          >
            {pastBookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CANCELLED')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.95rem',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'CANCELLED'
                ? '2px solid var(--color-primary)'
                : '2px solid transparent',
            color: activeTab === 'CANCELLED' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>Cancelled / Rejected</span>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              backgroundColor: 'var(--color-surface-subtle)',
              color: 'var(--color-text-muted)',
            }}
          >
            {cancelledBookings.length}
          </span>
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="card skeleton" style={{ height: '160px' }} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && displayedBookings.length === 0 && (
        <div
          className="card"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface-subtle)',
            border: '2px dashed var(--color-border)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary-dark)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <Ticket size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>
            {activeTab === 'ACTIVE'
              ? 'No Active Reservations'
              : activeTab === 'PAST'
                ? 'No Past Reservations'
                : 'No Cancelled Reservations'}
          </h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.95rem',
              maxWidth: '420px',
              marginInline: 'auto',
              marginBottom: '1.5rem',
            }}
          >
            {activeTab === 'ACTIVE'
              ? 'You have not reserved any upcoming rides. Search for verified drivers heading your way.'
              : 'Your booking records will appear here after completion or cancellation.'}
          </p>
          <Link
            to="/rides"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Compass size={16} /> Discover Available Rides
          </Link>
        </div>
      )}

      {/* Bookings List */}
      {!loading && displayedBookings.length > 0 && (
        <motion.div
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {displayedBookings.map((b) => {
            const rideDate = b.ride?.departureTime ? new Date(b.ride.departureTime) : null;
            const formattedDate = rideDate
              ? rideDate.toLocaleDateString(undefined, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Flexible Schedule';
            const formattedTime = rideDate
              ? rideDate.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              : '';

            return (
              <motion.div
                key={b.id}
                variants={staggerItemVariants}
                className="card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                {/* Header row: corridor and status badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: 'var(--color-text)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span>{b.ride?.origin || 'Origin'}</span>
                      <ArrowRight size={18} style={{ color: 'var(--color-primary)' }} />
                      <span>{b.ride?.destination || 'Destination'}</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-muted)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
                        {formattedDate}
                      </span>
                      {formattedTime && (
                        <span
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Clock size={14} style={{ color: 'var(--color-primary)' }} />
                          {formattedTime}
                        </span>
                      )}
                      <span
                        className={`badge ${b.ride?.type === 'CITY' ? 'badge-city' : 'badge-intercity'}`}
                      >
                        {b.ride?.type === 'CITY' ? 'City Commute' : 'Intercity'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`badge ${
                        b.status === 'CONFIRMED'
                          ? 'badge-success'
                          : b.status === 'PENDING'
                            ? 'badge-outline'
                            : b.status === 'REJECTED' || b.status === 'CANCELLED'
                              ? 'badge-error'
                              : 'badge-outline'
                      }`}
                      style={{
                        fontSize: '0.85rem',
                        padding: '0.35rem 0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {b.status === 'PENDING' && 'Pending Driver Approval'}
                      {b.status === 'CONFIRMED' && 'Seat Confirmed'}
                      {b.status === 'REJECTED' && 'Request Declined'}
                      {b.status === 'CANCELLED' && 'Cancelled'}
                      {b.status === 'COMPLETED' && 'Trip Completed'}
                    </span>
                  </div>
                </div>

                {/* Middle section: Reservation details & Driver Info */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                    backgroundColor: 'var(--color-surface-subtle)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {/* Seat and pricing snapshot */}
                  <div>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Reserved Seats & Fare
                    </span>
                    <div
                      style={{
                        marginTop: '0.2rem',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        color: 'var(--color-text)',
                      }}
                    >
                      {b.seatsBooked} {b.seatsBooked === 1 ? 'Seat' : 'Seats'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      ₹{b.pricePerSeat} per seat • Total:{' '}
                      <strong style={{ color: 'var(--color-primary-dark)' }}>
                        ₹{b.totalPrice}
                      </strong>
                    </div>
                  </div>

                  {/* Driver Card */}
                  <div>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Driver & Trust
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '0.2rem',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary-dark)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <User size={15} />
                      </div>
                      <span style={{ fontWeight: 600 }}>
                        {b.ride?.driver?.name || 'Verified Driver'}
                      </span>
                      {b.ride?.driver?.isVerified && (
                        <span title="Verified Commuter">
                          <ShieldCheck size={16} style={{ color: 'var(--color-success)' }} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Specs */}
                  <div>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Vehicle
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        marginTop: '0.2rem',
                      }}
                    >
                      {b.ride?.vehicle?.type === 'CAR' ? <Car size={16} /> : <Bike size={16} />}
                      <span style={{ fontWeight: 600 }}>
                        {b.ride?.vehicle
                          ? `${b.ride.vehicle.make} ${b.ride.vehicle.model}`
                          : 'Vehicle Registered'}
                      </span>
                    </div>
                    {b.ride?.vehicle?.color && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {b.ride.vehicle.color} • Capacity: {b.ride.vehicle.capacity} seats
                      </div>
                    )}
                  </div>
                </div>

                {/* Pickup / Dropoff notes */}
                {(b.ride?.pickupPoint || b.ride?.dropoffPoint) && (
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      gap: '1.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {b.ride?.pickupPoint && (
                      <div>
                        <strong>Pickup Point:</strong> {b.ride.pickupPoint}
                      </div>
                    )}
                    {b.ride?.dropoffPoint && (
                      <div>
                        <strong>Dropoff Point:</strong> {b.ride.dropoffPoint}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--color-border)',
                  }}
                >
                  <Link
                    to={`/rides/${b.rideId}`}
                    className="btn btn-outline"
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
                  >
                    View Ride Overview
                  </Link>

                  {/* Cancel Button (Available for PENDING and CONFIRMED) */}
                  {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                    <button
                      type="button"
                      onClick={() => setCancellingBooking(b)}
                      className="btn"
                      style={{
                        fontSize: '0.85rem',
                        padding: '0.4rem 0.85rem',
                        color: 'var(--color-error)',
                        border: '1px solid #fecaca',
                        backgroundColor: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <XCircle size={15} />
                      Cancel Reservation
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancellingBooking && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <motion.div
              variants={modalBackdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setCancellingBooking(null)}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(3px)',
              }}
            />

            <motion.div
              variants={modalContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="card"
              style={{
                position: 'relative',
                zIndex: 1001,
                width: '100%',
                maxWidth: '480px',
                padding: '2rem',
                backgroundColor: '#ffffff',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <AlertCircle size={24} />
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                Cancel This Reservation?
              </h2>

              <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '0.95rem',
                  marginBottom: '1.5rem',
                  lineHeight: 1.5,
                }}
              >
                {cancellingBooking.status === 'CONFIRMED'
                  ? `You are about to cancel your confirmed reservation for ${cancellingBooking.seatsBooked} seat(s). Your seat(s) will immediately be released back to other commuters on this corridor.`
                  : 'You are about to withdraw your pending booking request.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setCancellingBooking(null)}
                  disabled={cancelling}
                  className="btn btn-outline"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="btn"
                  style={{
                    backgroundColor: 'var(--color-error)',
                    color: '#ffffff',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
