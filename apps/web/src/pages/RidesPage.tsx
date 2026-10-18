import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Calendar,
  Car,
  Bike,
  ArrowRight,
  Clock,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { Ride, VehicleType, RideType } from '@ridemitra/shared';

export const RidesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search input state
  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [vehicleType, setVehicleType] = useState<string>(searchParams.get('vehicleType') || 'ALL');
  const [rideType, setRideType] = useState<string>(searchParams.get('rideType') || 'ALL');
  const [sortBy, setSortBy] = useState<'departureTime' | 'price'>(
    (searchParams.get('sortBy') as 'departureTime' | 'price') || 'departureTime',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
  );

  // Pagination state
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [limit] = useState<number>(10);

  // Data fetching state
  const [rides, setRides] = useState<Ride[]>([]);
  const [totalRides, setTotalRides] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRides = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.searchRides({
        origin: origin.trim() || undefined,
        destination: destination.trim() || undefined,
        date: date || undefined,
        vehicleType: vehicleType !== 'ALL' ? (vehicleType as VehicleType) : undefined,
        type: rideType !== 'ALL' ? (rideType as RideType) : undefined,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      setRides(Array.isArray(res?.items) ? res.items : []);
      setTotalRides(res?.total ?? 0);
      setTotalPages(res?.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [page, sortBy, sortOrder, vehicleType, rideType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);

    // Sync to search params
    const params: Record<string, string> = {};
    if (origin.trim()) params.origin = origin.trim();
    if (destination.trim()) params.destination = destination.trim();
    if (date) params.date = date;
    if (vehicleType !== 'ALL') params.vehicleType = vehicleType;
    if (rideType !== 'ALL') params.rideType = rideType;
    params.sortBy = sortBy;
    params.sortOrder = sortOrder;
    setSearchParams(params);

    fetchRides();
  };

  const handleClearFilters = () => {
    setOrigin('');
    setDestination('');
    setDate('');
    setVehicleType('ALL');
    setRideType('ALL');
    setSortBy('departureTime');
    setSortOrder('asc');
    setPage(1);
    setSearchParams({});
    setTimeout(() => {
      apiClient.searchRides({ page: 1, limit: 10 }).then((res) => {
        setRides(Array.isArray(res?.items) ? res.items : []);
        setTotalRides(res?.total ?? 0);
        setTotalPages(res?.totalPages ?? 1);
      });
    }, 0);
  };

  return (
    <div className="container" style={{ paddingBlock: '2.5rem 4rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
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
            <h1
              style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: 800,
                marginBottom: '0.35rem',
              }}
            >
              Discover Shared Rides
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
              Connect with verified drivers travelling across Gujarat cities and commute corridors
            </p>
          </div>
          <Link
            to="/offer-ride"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={18} /> Offer a Ride
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '2rem',
        }}
      >
        <form onSubmit={handleSearchSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              alignItems: 'flex-end',
            }}
          >
            {/* Origin */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label
                htmlFor="search-origin"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <MapPin size={15} style={{ color: 'var(--color-primary)' }} /> Origin
              </label>
              <input
                id="search-origin"
                type="text"
                placeholder="e.g. Surat, Adajan"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            {/* Destination */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label
                htmlFor="search-destination"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <MapPin size={15} style={{ color: 'var(--color-primary)' }} /> Destination
              </label>
              <input
                id="search-destination"
                type="text"
                placeholder="e.g. Ahmedabad, SG Highway"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            {/* Travel Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label
                htmlFor="search-date"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Calendar size={15} style={{ color: 'var(--color-primary)' }} /> Travel Date
              </label>
              <input
                id="search-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  minHeight: '44px',
                }}
              >
                <Search size={16} /> Search
              </button>
              {(origin || destination || date || vehicleType !== 'ALL' || rideType !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn btn-outline"
                  style={{ minHeight: '44px', paddingInline: '0.85rem' }}
                  title="Clear all filters"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Filters Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginTop: '1.25rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            {/* Vehicle Mode Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}
              >
                Mode:
              </span>
              <button
                type="button"
                onClick={() => {
                  setVehicleType('ALL');
                  setPage(1);
                }}
                className={`btn btn-sm ${vehicleType === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                All Modes
              </button>
              <button
                type="button"
                onClick={() => {
                  setVehicleType('CAR');
                  setPage(1);
                }}
                className={`btn btn-sm ${vehicleType === 'CAR' ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Car size={14} /> Carpool
              </button>
              <button
                type="button"
                onClick={() => {
                  setVehicleType('BIKE');
                  setPage(1);
                }}
                className={`btn btn-sm ${vehicleType === 'BIKE' ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Bike size={14} /> Bikepool
              </button>
            </div>

            {/* Ride Type & Sort Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}
                >
                  Route:
                </span>
                <select
                  aria-label="Route Type Filter"
                  value={rideType}
                  onChange={(e) => {
                    setRideType(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    padding: '0.4rem 0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                >
                  <option value="ALL">All Routes</option>
                  <option value="CITY">City Only</option>
                  <option value="INTERCITY">Intercity Only</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}
                >
                  Sort:
                </span>
                <select
                  aria-label="Sort Rides By"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-') as [
                      'departureTime' | 'price',
                      'asc' | 'desc',
                    ];
                    setSortBy(field);
                    setSortOrder(order);
                    setPage(1);
                  }}
                  style={{
                    padding: '0.4rem 0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                >
                  <option value="departureTime-asc">Departure: Earliest first</option>
                  <option value="departureTime-desc">Departure: Latest first</option>
                  <option value="price-asc">Price: Lowest first</option>
                  <option value="price-desc">Price: Highest first</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <div style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
          {loading ? (
            'Searching available rides...'
          ) : (
            <span>
              Found <strong>{totalRides}</strong> ride{totalRides === 1 ? '' : 's'} matching your
              criteria
            </span>
          )}
        </div>
      </div>

      {/* Error State with Retry */}
      {error && (
        <div
          role="alert"
          className="card"
          style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-error-bg)',
            borderColor: 'var(--color-error)',
            marginBottom: '2rem',
          }}
        >
          <p style={{ color: 'var(--color-error)', fontWeight: 600, marginBottom: '1rem' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={fetchRides}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} /> Retry Search
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="card"
              style={{
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div className="skeleton" style={{ width: '120px', height: '24px' }} />
                <div className="skeleton" style={{ width: '80px', height: '24px' }} />
              </div>
              <div className="skeleton" style={{ width: '60%', height: '32px' }} />
              <div className="skeleton" style={{ width: '40%', height: '20px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && (!rides || rides.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
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
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary-dark)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <Search size={30} />
          </div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>No Rides Found</h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.95rem',
              maxWidth: '460px',
              marginInline: 'auto',
              marginBottom: '1.75rem',
            }}
          >
            There are currently no scheduled rides matching your origin, destination, or date
            filters. Try adjusting your search criteria or be the first to offer a ride!
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={handleClearFilters} className="btn btn-outline">
              Clear All Filters
            </button>
            <Link
              to="/offer-ride"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <PlusCircle size={16} /> Offer This Ride
            </Link>
          </div>
        </motion.div>
      )}

      {/* Ride Cards List */}
      {!loading && !error && rides && rides.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <AnimatePresence>
            {rides.map((ride, idx) => {
              const departureDate = new Date(ride.departureTime);
              const formattedDate = departureDate.toLocaleDateString(undefined, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
              const formattedTime = departureDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  className="card"
                  style={{
                    padding: '1.5rem',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    {/* Time & Route Type Badges */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
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
                          color: 'var(--color-primary-dark)',
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
                        {ride.type === 'CITY' ? 'City Commute' : 'Intercity Travel'}
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
                      {ride.distanceKm ? (
                        <span
                          className="badge badge-outline"
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            color: 'var(--color-primary)',
                            borderColor: 'var(--color-primary-subtle, #bfdbfe)',
                          }}
                        >
                          {ride.distanceKm} km
                        </span>
                      ) : null}
                    </div>

                    {/* Price Tag */}
                    <div style={{ textAlign: 'right' }}>
                      {ride.pricePerSeat ? (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                          <span
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 800,
                              color: 'var(--color-primary)',
                            }}
                          >
                            ₹{ride.pricePerSeat}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            / seat
                          </span>
                        </div>
                      ) : (
                        <span
                          className="badge badge-success"
                          style={{ fontSize: '0.85rem', fontWeight: 600 }}
                        >
                          Free / Shared Fuel
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Route Corridor */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '1.25rem',
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
                          fontSize: '1.2rem',
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

                    {/* Vehicle & Seats Summary */}
                    <div
                      style={{
                        backgroundColor: 'var(--color-surface-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          VEHICLE
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {ride.vehicle
                            ? `${ride.vehicle.make} ${ride.vehicle.model}`
                            : 'Vehicle Registered'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          SEATS AVAILABLE
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color:
                              ride.availableSeats > 1
                                ? 'var(--color-success)'
                                : 'var(--color-warning)',
                          }}
                        >
                          {ride.availableSeats} of {ride.totalSeats} seat(s)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Driver Footer & Action */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary-dark)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                        }}
                      >
                        {ride.driver ? ride.driver.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          {ride.driver?.name || 'Commuter'}
                          {ride.driver?.isVerified && (
                            <span title="Verified Commuter" style={{ display: 'inline-flex' }}>
                              <ShieldCheck size={15} style={{ color: 'var(--color-primary)' }} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/rides/${ride.id}`}
                      className="btn btn-outline btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontWeight: 600,
                      }}
                    >
                      View Details <ArrowRight size={14} />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1.5rem',
              }}
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn btn-outline btn-sm"
              >
                Previous
              </button>
              <span
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--color-text-muted)',
                  paddingInline: '0.5rem',
                }}
              >
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="btn btn-outline btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
