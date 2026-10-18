import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car,
  MapPin,
  Calendar,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Users,
  IndianRupee,
  ArrowRight,
  Navigation,
} from 'lucide-react';
import { apiClient, ApiError } from '../lib/apiClient';
import type { Vehicle, RideType } from '@ridemitra/shared';
import { POPULAR_CITIES, POPULAR_CITY_COORDINATES } from '@ridemitra/shared';
import { RouteMap } from '../components/maps/RouteMap';
import { RouteMetricsBadge } from '../components/maps/RouteMetricsBadge';
import { MapErrorBoundary } from '../components/maps/MapErrorBoundary';
import { fetchOsrmRoute, OsrmRouteResult } from '../lib/osrm';

export const OfferRidePage: React.FC = () => {
  const navigate = useNavigate();

  // Vehicle loading state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // Form states
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupPoint, setPickupPoint] = useState('');
  const [dropoffPoint, setDropoffPoint] = useState('');
  const [rideType, setRideType] = useState<RideType>('CITY');

  // Geographic coordinates & routing states (Optional Leaflet + OSRM enhancement)
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isPickupApproximate, setIsPickupApproximate] = useState<boolean>(false);
  const [isDropoffApproximate, setIsDropoffApproximate] = useState<boolean>(false);
  const [activeSelection, setActiveSelection] = useState<'origin' | 'destination'>('origin');
  const [osrmResult, setOsrmResult] = useState<OsrmRouteResult | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  // Schedule states
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('09:00');

  // Vehicle & Seat states
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [seatsOffered, setSeatsOffered] = useState<number>(1);

  // Pricing & Notes
  const [price, setPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const res = await apiClient.getVehicles();
        setVehicles(res.vehicles);
        if (res.vehicles.length > 0) {
          setSelectedVehicleId(res.vehicles[0].id);
          setSeatsOffered(
            res.vehicles[0].type === 'BIKE' ? 1 : Math.min(3, res.vehicles[0].capacity),
          );
        }
      } catch {
        setErrorMsg('Failed to load your registered vehicles.');
      } finally {
        setLoadingVehicles(false);
      }
    }
    fetchVehicles();
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // Helper to match city name against known corridor coordinates
  const resolveCityCoordinates = (cityName: string): { lat: number; lng: number } | null => {
    const clean = cityName.trim().toLowerCase();
    if (!clean) return null;
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

  // Auto-seed pickup coordinates when user changes origin city, or clear if unrecognized/empty
  const handleOriginChange = (val: string) => {
    setOrigin(val);
    const resolved = resolveCityCoordinates(val);
    if (resolved) {
      setPickupCoords(resolved);
      setIsPickupApproximate(true);
    } else {
      setPickupCoords(null);
      setIsPickupApproximate(false);
    }
  };

  // Auto-seed drop-off coordinates when user changes destination city, or clear if unrecognized/empty
  const handleDestinationChange = (val: string) => {
    setDestination(val);
    const resolved = resolveCityCoordinates(val);
    if (resolved) {
      setDropoffCoords(resolved);
      setIsDropoffApproximate(true);
    } else {
      setDropoffCoords(null);
      setIsDropoffApproximate(false);
    }
  };

  // Fetch OSRM driving route when both pickup and drop-off coordinates are set
  useEffect(() => {
    if (!pickupCoords || !dropoffCoords) {
      setOsrmResult(null);
      return;
    }

    let isMounted = true;
    setCalculatingRoute(true);

    const timer = setTimeout(async () => {
      try {
        const route = await fetchOsrmRoute(pickupCoords, dropoffCoords);
        if (isMounted) {
          setOsrmResult(route);
        }
      } catch {
        if (isMounted) {
          setOsrmResult(null);
        }
      } finally {
        if (isMounted) {
          setCalculatingRoute(false);
        }
      }
    }, 350); // 350ms debounce to prevent spamming demo server on marker drag

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [pickupCoords?.lat, pickupCoords?.lng, dropoffCoords?.lat, dropoffCoords?.lng]);

  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const v = vehicles.find((veh) => veh.id === vehicleId);
    if (v) {
      if (v.type === 'BIKE') {
        setSeatsOffered(1);
      } else {
        setSeatsOffered(Math.min(seatsOffered || 1, v.capacity));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Basic Validations
    if (!origin.trim() || !destination.trim()) {
      setErrorMsg('Please specify both origin and destination.');
      return;
    }

    if (!date || !time) {
      setErrorMsg('Please specify travel date and departure time.');
      return;
    }

    // Departure time validation
    const departureDateTime = new Date(`${date}T${time}:00`);
    if (isNaN(departureDateTime.getTime())) {
      setErrorMsg('Invalid departure date or time.');
      return;
    }
    if (departureDateTime.getTime() <= Date.now()) {
      setErrorMsg('Departure time must be in the future.');
      return;
    }

    if (!selectedVehicle) {
      setErrorMsg('Please select a valid registered vehicle.');
      return;
    }

    if (selectedVehicle.type === 'BIKE' && seatsOffered !== 1) {
      setErrorMsg('Bikepool rides are restricted to strictly 1 passenger seat.');
      return;
    }

    if (seatsOffered < 1 || seatsOffered > selectedVehicle.capacity) {
      setErrorMsg(
        `Offered seats must be between 1 and your vehicle's capacity (${selectedVehicle.capacity}).`,
      );
      return;
    }

    const numericPrice = price.trim() ? Number(price) : undefined;
    if (numericPrice !== undefined && (isNaN(numericPrice) || numericPrice < 0)) {
      setErrorMsg('Price must be a valid non-negative number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.createRide({
        vehicleId: selectedVehicle.id,
        origin: origin.trim(),
        destination: destination.trim(),
        pickupPoint: pickupPoint.trim() || undefined,
        dropoffPoint: dropoffPoint.trim() || undefined,
        pickupLat: pickupCoords?.lat ?? undefined,
        pickupLng: pickupCoords?.lng ?? undefined,
        dropoffLat: dropoffCoords?.lat ?? undefined,
        dropoffLng: dropoffCoords?.lng ?? undefined,
        distanceKm: osrmResult?.distanceKm ?? undefined,
        durationMinutes: osrmResult?.durationMinutes ?? undefined,
        type: rideType,
        departureTime: departureDateTime.toISOString(),
        availableSeats: seatsOffered,
        pricePerSeat: numericPrice,
        description: notes.trim() || undefined,
      });

      setSuccessMsg('Ride offered successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/rides/${res.ride.id}`);
      }, 1200);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to publish ride. Please check your network connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingVehicles) {
    return (
      <div className="container" style={{ paddingBlock: '4rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading vehicle details...</p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="container" style={{ paddingBlock: '4rem', maxWidth: '600px' }}>
        <div
          className="card"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)',
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
            <Car size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
            Register a Vehicle to Offer Rides
          </h1>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.95rem',
              marginBottom: '2rem',
              lineHeight: 1.6,
            }}
          >
            To offer a carpool or bikepool ride, you must first register the vehicle you will be
            driving. This ensures commuter trust, passenger safety, and verified seat capacity.
          </p>
          <Link
            to="/vehicles"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={18} /> Register Vehicle Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBlock: '3rem 4rem', maxWidth: '780px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
            fontWeight: 800,
            marginBottom: '0.4rem',
          }}
        >
          Offer a Ride
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
          Publish your upcoming city commute or intercity travel to share fuel costs with fellow
          commuters
        </p>
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

      {/* Ride Form */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Section 1: Route Corridor */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <MapPin size={20} style={{ color: 'var(--color-primary)' }} />
                <h2 style={{ fontSize: '1.25rem' }}>1. Route & Corridor</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Ride Type Choice */}
                <div>
                  <label
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Ride Type
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label
                      style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor:
                          rideType === 'CITY' ? 'var(--color-primary)' : 'var(--color-border)',
                        backgroundColor:
                          rideType === 'CITY' ? 'var(--color-primary-light)' : 'transparent',
                        color:
                          rideType === 'CITY' ? 'var(--color-primary-dark)' : 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="rideType"
                        value="CITY"
                        checked={rideType === 'CITY'}
                        onChange={() => setRideType('CITY')}
                        className="visually-hidden"
                      />
                      City Commute
                    </label>

                    <label
                      style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor:
                          rideType === 'INTERCITY' ? 'var(--color-primary)' : 'var(--color-border)',
                        backgroundColor:
                          rideType === 'INTERCITY' ? 'var(--color-primary-light)' : 'transparent',
                        color:
                          rideType === 'INTERCITY'
                            ? 'var(--color-primary-dark)'
                            : 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="rideType"
                        value="INTERCITY"
                        checked={rideType === 'INTERCITY'}
                        onChange={() => setRideType('INTERCITY')}
                        className="visually-hidden"
                      />
                      Intercity Travel
                    </label>
                  </div>
                </div>

                {/* Origin & Destination with Popular City Autocomplete Datalist */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label htmlFor="origin" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Origin City / Area *
                    </label>
                    <input
                      id="origin"
                      type="text"
                      list="popular-cities-origin"
                      required
                      placeholder="e.g. Surat, Adajan"
                      value={origin}
                      onChange={(e) => handleOriginChange(e.target.value)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    />
                    <datalist id="popular-cities-origin">
                      {POPULAR_CITIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label htmlFor="destination" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Destination City / Area *
                    </label>
                    <input
                      id="destination"
                      type="text"
                      list="popular-cities-destination"
                      required
                      placeholder="e.g. Ahmedabad, SG Highway"
                      value={destination}
                      onChange={(e) => handleDestinationChange(e.target.value)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    />
                    <datalist id="popular-cities-destination">
                      {POPULAR_CITIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Pickup & Dropoff Specific Points */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label htmlFor="pickup" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Pickup Landmark (Optional)
                    </label>
                    <input
                      id="pickup"
                      type="text"
                      placeholder="e.g. Star Bazaar Circle"
                      value={pickupPoint}
                      onChange={(e) => setPickupPoint(e.target.value)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label htmlFor="dropoff" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Drop-off Landmark (Optional)
                    </label>
                    <input
                      id="dropoff"
                      type="text"
                      placeholder="e.g. Iscon Mall Gate 1"
                      value={dropoffPoint}
                      onChange={(e) => setDropoffPoint(e.target.value)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    />
                  </div>
                </div>

                {/* Phase 5.3: Interactive Leaflet Map Preview & OSRM Route Metrics */}
                <div style={{ marginTop: '0.75rem' }}>
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
                    <div>
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
                        Route Map Preview (OpenStreetMap & OSRM)
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)',
                          display: 'block',
                          marginTop: '2px',
                        }}
                      >
                        Drag markers or click map to pinpoint pickup and drop-off coordinates
                      </span>
                    </div>

                    {/* Active pin selector buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setActiveSelection('origin')}
                        className="btn btn-sm"
                        style={{
                          fontSize: '0.775rem',
                          padding: '4px 10px',
                          backgroundColor:
                            activeSelection === 'origin' ? '#059669' : 'transparent',
                          color: activeSelection === 'origin' ? '#ffffff' : 'var(--color-text)',
                          border: '1px solid',
                          borderColor: activeSelection === 'origin' ? '#059669' : 'var(--color-border)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: activeSelection === 'origin' ? '#ffffff' : '#059669',
                          }}
                        />
                        Set Pickup
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSelection('destination')}
                        className="btn btn-sm"
                        style={{
                          fontSize: '0.775rem',
                          padding: '4px 10px',
                          backgroundColor:
                            activeSelection === 'destination' ? '#4f46e5' : 'transparent',
                          color: activeSelection === 'destination' ? '#ffffff' : 'var(--color-text)',
                          border: '1px solid',
                          borderColor:
                            activeSelection === 'destination' ? '#4f46e5' : 'var(--color-border)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor:
                              activeSelection === 'destination' ? '#ffffff' : '#4f46e5',
                          }}
                        />
                        Set Drop-off
                      </button>
                    </div>
                  </div>

                  <MapErrorBoundary fallbackText="Route map preview temporarily unavailable. You can still publish your ride.">
                    <RouteMap
                      origin={
                        pickupCoords
                          ? {
                              lat: pickupCoords.lat,
                              lng: pickupCoords.lng,
                              label: pickupPoint || origin || 'Pickup Point',
                              isApproximate: isPickupApproximate,
                            }
                          : null
                      }
                      destination={
                        dropoffCoords
                          ? {
                              lat: dropoffCoords.lat,
                              lng: dropoffCoords.lng,
                              label: dropoffPoint || destination || 'Drop-off Point',
                              isApproximate: isDropoffApproximate,
                            }
                          : null
                      }
                      polyline={osrmResult?.polylineCoordinates}
                      editable={true}
                      activeSelection={activeSelection}
                      onOriginChange={(pos) => {
                        setPickupCoords(pos);
                        setIsPickupApproximate(false);
                      }}
                      onDestinationChange={(pos) => {
                        setDropoffCoords(pos);
                        setIsDropoffApproximate(false);
                      }}
                      height="300px"
                    />
                  </MapErrorBoundary>

                  {(isPickupApproximate || isDropoffApproximate) && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        padding: '8px 12px',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: 'var(--radius-md, 8px)',
                        color: '#92400e',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        lineHeight: 1.4,
                      }}
                    >
                      <span>📍</span>
                      <span>
                        Approximate city center — adjust the pin for your exact location.
                      </span>
                    </div>
                  )}

                  {/* Route Metrics (Distance & Duration) */}
                  <div style={{ marginTop: '0.75rem' }}>
                    {calculatingRoute ? (
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-text-muted)',
                          fontStyle: 'italic',
                        }}
                      >
                        Estimating driving road distance & duration via OSRM...
                      </span>
                    ) : (
                      <RouteMetricsBadge
                        distanceKm={osrmResult?.distanceKm}
                        durationMinutes={osrmResult?.durationMinutes}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Departure Schedule */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
                <h2 style={{ fontSize: '1.25rem' }}>2. Schedule</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label htmlFor="date" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Travel Date *
                  </label>
                  <input
                    id="date"
                    type="date"
                    required
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label htmlFor="time" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Departure Time *
                  </label>
                  <input
                    id="time"
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Vehicle & Seats */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <Users size={20} style={{ color: 'var(--color-primary)' }} />
                <h2 style={{ fontSize: '1.25rem' }}>3. Vehicle & Seats</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Vehicle Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label htmlFor="vehicle" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Select Vehicle *
                  </label>
                  <select
                    id="vehicle"
                    value={selectedVehicleId}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.make} {v.model} ({v.type === 'CAR' ? 'Carpool' : 'Bikepool'} ·{' '}
                        {v.registrationNumber} · {v.capacity} max seats)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Available Seats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <label htmlFor="seats" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Passenger Seats Offered *
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {selectedVehicle?.type === 'BIKE'
                        ? 'Bikepool fixed to 1 passenger'
                        : `Max allowed: ${selectedVehicle?.capacity || 4} seats`}
                    </span>
                  </div>
                  <input
                    id="seats"
                    type="number"
                    required
                    min={1}
                    max={selectedVehicle?.type === 'BIKE' ? 1 : selectedVehicle?.capacity || 8}
                    disabled={selectedVehicle?.type === 'BIKE'}
                    value={seatsOffered}
                    onChange={(e) => setSeatsOffered(Number(e.target.value))}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor:
                        selectedVehicle?.type === 'BIKE'
                          ? 'var(--color-surface-subtle)'
                          : 'var(--color-surface)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Pricing & Instructions */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <IndianRupee size={20} style={{ color: 'var(--color-primary)' }} />
                <h2 style={{ fontSize: '1.25rem' }}>4. Pricing & Instructions</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label htmlFor="price" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Price Per Passenger (₹, Optional)
                  </label>
                  <input
                    id="price"
                    type="number"
                    min={0}
                    max={5000}
                    placeholder="e.g. 150 (Leave blank for free / fuel cost sharing)"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label htmlFor="notes" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Ride Instructions / Commuter Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="e.g. AC car, non-smoking, boot space available for one small backpack per passenger."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-outline"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{
                  minWidth: '160px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {submitting ? 'Publishing...' : 'Publish Ride'}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
