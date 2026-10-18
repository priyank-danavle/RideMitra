import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient, ApiError } from '../lib/apiClient';
import type { Ride, UpdateRideRequest, Booking } from '@ridemitra/shared';
import {
  Calendar,
  Clock,
  Car,
  Bike,
  PlusCircle,
  ArrowRight,
  Edit3,
  XCircle,
  AlertCircle,
  CheckCircle2,
  X,
  Ticket,
  User,
  ShieldCheck,
  Check,
} from 'lucide-react';

type TabType = 'UPCOMING' | 'REQUESTS' | 'PAST' | 'CANCELLED';

export const MyRidesPage: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('UPCOMING');
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  // Action states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Modal state
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateRideRequest>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Cancel Modal state
  const [cancellingRide, setCancellingRide] = useState<Ride | null>(null);
  const [savingCancel, setSavingCancel] = useState(false);

  const fetchMyRides = async () => {
    try {
      const res = await apiClient.getMyRides();
      setRides(Array.isArray(res?.rides) ? res.rides : []);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to retrieve your rides.');
    }
  };

  const fetchDriverBookings = async () => {
    try {
      const res = await apiClient.getDriverBookings();
      setBookings(Array.isArray(res?.bookings) ? res.bookings : []);
    } catch {
      // Non-critical
    }
  };

  const reloadData = async () => {
    setLoading(true);
    await Promise.all([fetchMyRides(), fetchDriverBookings()]);
    setLoading(false);
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleConfirmBooking = async (bookingId: string) => {
    setProcessingBookingId(bookingId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await apiClient.confirmBooking(bookingId);
      setSuccessMsg('Booking confirmed! Passenger seats allocated.');
      await reloadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to confirm booking request.');
      }
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    setProcessingBookingId(bookingId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await apiClient.rejectBooking(bookingId);
      setSuccessMsg('Booking request rejected.');
      await reloadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to reject booking request.');
      }
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setProcessingBookingId(bookingId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await apiClient.cancelBooking(bookingId);
      setSuccessMsg('Booking cancelled and seats released back to available capacity.');
      await reloadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to cancel booking.');
      }
    } finally {
      setProcessingBookingId(null);
    }
  };

  const now = new Date();

  // Tab Filtering
  const filteredRides = rides.filter((r) => {
    const departure = new Date(r.departureTime);
    if (activeTab === 'CANCELLED') {
      return r.status === 'CANCELLED';
    }
    if (activeTab === 'PAST') {
      return r.status === 'COMPLETED' || (r.status === 'SCHEDULED' && departure < now);
    }
    // UPCOMING: scheduled and departure in future
    return r.status === 'SCHEDULED' && departure >= now;
  });

  const pendingBookingsCount = bookings.filter((b) => b.status === 'PENDING').length;

  // Handle Edit Click
  const handleOpenEdit = (ride: Ride) => {
    setEditingRide(ride);
    setEditFormData({
      pickupPoint: ride.pickupPoint || '',
      dropoffPoint: ride.dropoffPoint || '',
      availableSeats: ride.availableSeats,
      pricePerSeat: ride.pricePerSeat ?? undefined,
      description: ride.description || '',
    });
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Handle Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRide) return;
    setErrorMsg(null);

    setSavingEdit(true);
    try {
      await apiClient.updateRide(editingRide.id, {
        pickupPoint: editFormData.pickupPoint ? editFormData.pickupPoint.trim() : undefined,
        dropoffPoint: editFormData.dropoffPoint ? editFormData.dropoffPoint.trim() : undefined,
        availableSeats: Number(editFormData.availableSeats),
        pricePerSeat:
          editFormData.pricePerSeat !== undefined ? Number(editFormData.pricePerSeat) : undefined,
        description: editFormData.description ? editFormData.description.trim() : undefined,
      });

      setSuccessMsg('Ride details updated successfully!');
      setEditingRide(null);
      await fetchMyRides();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to update ride.');
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Cancel Click
  const handleConfirmCancel = async () => {
    if (!cancellingRide) return;
    setErrorMsg(null);
    setSavingCancel(true);

    try {
      await apiClient.cancelRide(cancellingRide.id);
      setSuccessMsg('Ride cancelled successfully. It has been removed from discovery.');
      setCancellingRide(null);
      await fetchMyRides();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to cancel ride.');
      }
    } finally {
      setSavingCancel(false);
    }
  };

  return (
    <div className="container" style={{ paddingBlock: '3rem 4rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              fontWeight: 800,
              marginBottom: '0.4rem',
            }}
          >
            My Offered Rides
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
            Manage schedules, update passenger seats, or review past trips you've published
          </p>
        </div>

        <Link
          to="/offer-ride"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <PlusCircle size={18} /> Offer Another Ride
        </Link>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            fontSize: '0.95rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            fontSize: '0.95rem',
            fontWeight: 500,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('UPCOMING')}
          className={`btn btn-sm ${activeTab === 'UPCOMING' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          Upcoming Rides (
          {rides.filter((r) => r.status === 'SCHEDULED' && new Date(r.departureTime) >= now).length}
          )
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('REQUESTS')}
          className={`btn btn-sm ${activeTab === 'REQUESTS' ? 'btn-primary' : 'btn-outline'}`}
          style={{
            borderRadius: 'var(--radius-md)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Ticket size={14} />
          <span>
            Passenger Requests (
            {pendingBookingsCount > 0
              ? `⚡ ${pendingBookingsCount} Pending`
              : `${bookings.length} Total`}
            )
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PAST')}
          className={`btn btn-sm ${activeTab === 'PAST' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          Past Trips (
          {
            rides.filter(
              (r) =>
                r.status === 'COMPLETED' ||
                (r.status === 'SCHEDULED' && new Date(r.departureTime) < now),
            ).length
          }
          )
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CANCELLED')}
          className={`btn btn-sm ${activeTab === 'CANCELLED' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          Cancelled ({rides.filter((r) => r.status === 'CANCELLED').length})
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[1, 2].map((n) => (
            <div key={n} className="card" style={{ padding: '1.75rem' }}>
              <div
                className="skeleton"
                style={{ width: '40%', height: '28px', marginBottom: '1rem' }}
              />
              <div className="skeleton" style={{ width: '70%', height: '20px' }} />
            </div>
          ))}
        </div>
      )}

      {/* REQUESTS Tab: Aggregated Driver Requests View */}
      {activeTab === 'REQUESTS' && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {bookings.length === 0 ? (
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
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary-dark)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Ticket size={28} />
              </div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
                No Passenger Booking Requests
              </h2>
              <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '0.95rem',
                  maxWidth: '440px',
                  marginInline: 'auto',
                }}
              >
                When commuters search and request reservations on your offered rides, their booking
                requests will appear here for your review and seat confirmation.
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  border:
                    booking.status === 'PENDING'
                      ? '1px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                }}
              >
                {/* Header: Route & Status */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                    }}
                  >
                    <span>{booking.ride?.origin || 'Origin'}</span>
                    <ArrowRight size={16} style={{ color: 'var(--color-primary)' }} />
                    <span>{booking.ride?.destination || 'Destination'}</span>
                  </div>

                  <span
                    className={`badge ${
                      booking.status === 'CONFIRMED'
                        ? 'badge-success'
                        : booking.status === 'PENDING'
                          ? 'badge-primary'
                          : 'badge-outline'
                    }`}
                    style={{ fontWeight: 700 }}
                  >
                    {booking.status === 'PENDING' ? '⚡ Action Needed: Pending' : booking.status}
                  </span>
                </div>

                {/* Body: Passenger Info & Seat details */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    backgroundColor: 'var(--color-surface-subtle)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {/* Passenger */}
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      PASSENGER
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        marginTop: '0.2rem',
                      }}
                    >
                      <User size={16} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontWeight: 700 }}>
                        {booking.passenger?.name || 'Verified Passenger'}
                      </span>
                      {booking.passenger?.isVerified && (
                        <ShieldCheck size={15} style={{ color: 'var(--color-success)' }} />
                      )}
                    </div>
                  </div>

                  {/* Seats & Fare */}
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      SEATS REQUESTED
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>
                      {booking.seatsBooked} {booking.seatsBooked === 1 ? 'seat' : 'seats'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      TOTAL FARE
                    </span>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        color: 'var(--color-primary)',
                        marginTop: '0.2rem',
                      }}
                    >
                      ₹{booking.totalPrice}
                    </div>
                  </div>

                  {/* Remaining Capacity */}
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      REMAINING SEATS
                    </span>
                    <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>
                      {booking.ride?.availableSeats ?? 'N/A'} available
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <Link to={`/rides/${booking.rideId}`} className="btn btn-outline btn-sm">
                    View Ride
                  </Link>

                  {booking.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRejectBooking(booking.id)}
                        disabled={processingBookingId === booking.id}
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--color-error)', borderColor: '#fecaca' }}
                      >
                        <X size={15} /> Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmBooking(booking.id)}
                        disabled={
                          processingBookingId === booking.id ||
                          (booking.ride?.availableSeats ?? 1) < booking.seatsBooked
                        }
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Check size={15} />
                        {processingBookingId === booking.id
                          ? 'Confirming...'
                          : 'Accept & Lock Seats'}
                      </button>
                    </>
                  )}

                  {booking.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={processingBookingId === booking.id}
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--color-error)', borderColor: '#fecaca' }}
                    >
                      <XCircle size={15} />
                      {processingBookingId === booking.id ? 'Cancelling...' : 'Cancel Reservation'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Empty State for Rides Tabs */}
      {activeTab !== 'REQUESTS' && !loading && filteredRides.length === 0 && (
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
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary-dark)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <Calendar size={28} />
          </div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
            {activeTab === 'UPCOMING' && 'No Upcoming Rides'}
            {activeTab === 'PAST' && 'No Past Rides'}
            {activeTab === 'CANCELLED' && 'No Cancelled Rides'}
          </h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.95rem',
              maxWidth: '440px',
              marginInline: 'auto',
              marginBottom: '1.75rem',
            }}
          >
            {activeTab === 'UPCOMING'
              ? "You haven't scheduled any upcoming carpools or bikepools yet. Publish your route today!"
              : activeTab === 'PAST'
                ? 'Past trips will appear here after your departure time passes.'
                : 'Any rides you cancel will be safely archived here for your records.'}
          </p>
          {activeTab === 'UPCOMING' && (
            <Link
              to="/offer-ride"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <PlusCircle size={16} /> Offer a Ride Now
            </Link>
          )}
        </div>
      )}

      {/* Rides List */}
      {activeTab !== 'REQUESTS' && !loading && filteredRides.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <AnimatePresence>
            {filteredRides.map((ride, idx) => {
              const departureDate = new Date(ride.departureTime);
              const formattedDate = departureDate.toLocaleDateString(undefined, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const formattedTime = departureDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });
              const isEligibleForEdit = ride.status === 'SCHEDULED' && departureDate >= now;

              const rideBookings = bookings.filter((b) => b.rideId === ride.id);
              const pendingRideBookings = rideBookings.filter((b) => b.status === 'PENDING');
              const confirmedRideBookings = rideBookings.filter((b) => b.status === 'CONFIRMED');

              return (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  className="card"
                  style={{
                    padding: '1.75rem',
                    position: 'relative',
                  }}
                >
                  {/* Top Row: Date & Status Badges */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      marginBottom: '1rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontWeight: 700,
                          fontSize: '1rem',
                        }}
                      >
                        <Clock size={16} style={{ color: 'var(--color-primary)' }} />
                        {formattedTime} · {formattedDate}
                      </span>
                      <span
                        className={`badge ${
                          ride.type === 'CITY' ? 'badge-city' : 'badge-intercity'
                        }`}
                      >
                        {ride.type === 'CITY' ? 'City' : 'Intercity'}
                      </span>
                      <span
                        className={`badge ${
                          ride.vehicle?.type === 'CAR' ? 'badge-car' : 'badge-bike'
                        }`}
                      >
                        {ride.vehicle?.type === 'CAR' ? (
                          <>
                            <Car size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Carpool
                          </>
                        ) : (
                          <>
                            <Bike size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Bikepool
                          </>
                        )}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {pendingRideBookings.length > 0 && (
                        <span
                          className="badge badge-primary"
                          style={{ fontWeight: 700, fontSize: '0.8rem' }}
                        >
                          ⚡ {pendingRideBookings.length} Pending Request
                          {pendingRideBookings.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {confirmedRideBookings.length > 0 && (
                        <span
                          className="badge badge-success"
                          style={{ fontWeight: 700, fontSize: '0.8rem' }}
                        >
                          ✓ {confirmedRideBookings.length} Confirmed
                        </span>
                      )}
                      <span
                        className={`badge ${
                          ride.status === 'SCHEDULED'
                            ? 'badge-success'
                            : ride.status === 'CANCELLED'
                              ? 'badge-error'
                              : 'badge-outline'
                        }`}
                        style={{ fontWeight: 700 }}
                      >
                        {ride.status}
                      </span>
                    </div>
                  </div>

                  {/* Route & Details */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '1.5rem',
                      alignItems: 'center',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          marginBottom: '0.4rem',
                        }}
                      >
                        <span>{ride.origin}</span>
                        <ArrowRight size={18} style={{ color: 'var(--color-primary)' }} />
                        <span>{ride.destination}</span>
                      </div>
                      {(ride.pickupPoint || ride.dropoffPoint) && (
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            gap: '1rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          {ride.pickupPoint && <span>Pickup: {ride.pickupPoint}</span>}
                          {ride.dropoffPoint && <span>Drop: {ride.dropoffPoint}</span>}
                        </div>
                      )}
                    </div>

                    {/* Vehicle & Seats Information */}
                    <div
                      style={{
                        backgroundColor: 'var(--color-surface-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem 1.15rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          VEHICLE
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {ride.vehicle
                            ? `${ride.vehicle.make} ${ride.vehicle.model} (${ride.vehicle.registrationNumber || ''})`
                            : 'Vehicle Registered'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          SEATS AVAILABLE
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {ride.availableSeats} of {ride.totalSeats} seat(s)
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          PRICE
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: 'var(--color-primary)',
                          }}
                        >
                          {ride.pricePerSeat ? `₹${ride.pricePerSeat}` : 'Free'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passenger Bookings Panel for this Ride */}
                  {rideBookings.length > 0 && (
                    <div
                      style={{
                        marginBlock: '0.75rem 1rem',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-surface-subtle)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          marginBottom: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Ticket size={14} style={{ color: 'var(--color-primary)' }} />
                        <span>Passenger Reservations on this Corridor ({rideBookings.length})</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {rideBookings.map((b) => (
                          <div
                            key={b.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.85rem',
                              padding: '0.5rem 0.75rem',
                              backgroundColor: '#ffffff',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-border)',
                              flexWrap: 'wrap',
                              gap: '0.5rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <User size={14} />
                              <span style={{ fontWeight: 600 }}>
                                {b.passenger?.name || 'Passenger'}
                              </span>
                              <span style={{ color: 'var(--color-text-muted)' }}>
                                ({b.seatsBooked} {b.seatsBooked === 1 ? 'seat' : 'seats'} • ₹
                                {b.totalPrice})
                              </span>
                              <span
                                className={`badge ${
                                  b.status === 'CONFIRMED'
                                    ? 'badge-success'
                                    : b.status === 'PENDING'
                                      ? 'badge-primary'
                                      : 'badge-outline'
                                }`}
                                style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                              >
                                {b.status}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {b.status === 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectBooking(b.id)}
                                    disabled={processingBookingId === b.id}
                                    className="btn btn-outline btn-sm"
                                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                  >
                                    Reject
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmBooking(b.id)}
                                    disabled={
                                      processingBookingId === b.id ||
                                      ride.availableSeats < b.seatsBooked
                                    }
                                    className="btn btn-primary btn-sm"
                                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                  >
                                    Accept
                                  </button>
                                </>
                              )}
                              {b.status === 'CONFIRMED' && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelBooking(b.id)}
                                  disabled={processingBookingId === b.id}
                                  className="btn btn-outline btn-sm"
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.5rem',
                                    color: 'var(--color-error)',
                                  }}
                                >
                                  Cancel Seat
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '0.75rem',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid var(--color-border)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Link
                      to={`/rides/${ride.id}`}
                      className="btn btn-outline btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      Public View <ArrowRight size={14} />
                    </Link>

                    {isEligibleForEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ride)}
                          className="btn btn-outline btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Edit3 size={14} /> Edit Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancellingRide(ride)}
                          className="btn btn-outline btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: 'var(--color-error)',
                            borderColor: 'var(--color-error-bg)',
                          }}
                        >
                          <XCircle size={14} /> Cancel Ride
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Ride Modal */}
      {editingRide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 200,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h2 id="edit-modal-title" style={{ fontSize: '1.35rem' }}>
                Edit Ride Details
              </h2>
              <button
                type="button"
                onClick={() => setEditingRide(null)}
                className="btn btn-outline btn-sm"
                style={{ width: '32px', height: '32px', padding: 0 }}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>ROUTE</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    {editingRide.origin} ➔ {editingRide.destination}
                  </div>
                </div>

                {/* Available Seats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label htmlFor="editSeats" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Available Passenger Seats *
                  </label>
                  <input
                    id="editSeats"
                    type="number"
                    min={0}
                    max={editingRide.vehicle?.type === 'BIKE' ? 1 : 8}
                    disabled={editingRide.vehicle?.type === 'BIKE'}
                    value={editFormData.availableSeats || 0}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        availableSeats: Number(e.target.value),
                      }))
                    }
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                </div>

                {/* Price */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label htmlFor="editPrice" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Price Per Passenger (₹)
                  </label>
                  <input
                    id="editPrice"
                    type="number"
                    min={0}
                    max={5000}
                    value={editFormData.pricePerSeat ?? ''}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        pricePerSeat: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                </div>

                {/* Pickup & Dropoff Points */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label htmlFor="editPickup" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Pickup Landmark
                  </label>
                  <input
                    id="editPickup"
                    type="text"
                    value={editFormData.pickupPoint || ''}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, pickupPoint: e.target.value }))
                    }
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label htmlFor="editDropoff" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Drop-off Landmark
                  </label>
                  <input
                    id="editDropoff"
                    type="text"
                    value={editFormData.dropoffPoint || ''}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, dropoffPoint: e.target.value }))
                    }
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                </div>

                {/* Notes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label htmlFor="editNotes" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Notes / Instructions
                  </label>
                  <textarea
                    id="editNotes"
                    rows={2}
                    value={editFormData.description || ''}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                </div>

                {/* Modal Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    marginTop: '1rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setEditingRide(null)}
                    className="btn btn-outline"
                    disabled={savingEdit}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancellingRide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 200,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-error-bg)',
                color: 'var(--color-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <XCircle size={28} />
            </div>
            <h2 id="cancel-dialog-title" style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>
              Cancel Offered Ride?
            </h2>
            <p
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                marginBottom: '1.75rem',
              }}
            >
              Are you sure you want to cancel the trip from <strong>{cancellingRide.origin}</strong>{' '}
              to <strong>{cancellingRide.destination}</strong>? This ride will be removed from
              discovery search results immediately.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setCancellingRide(null)}
                className="btn btn-outline"
                disabled={savingCancel}
              >
                Keep Ride
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="btn"
                disabled={savingCancel}
                style={{
                  backgroundColor: 'var(--color-error)',
                  color: '#ffffff',
                  fontWeight: 600,
                }}
              >
                {savingCancel ? 'Cancelling...' : 'Yes, Cancel Ride'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
