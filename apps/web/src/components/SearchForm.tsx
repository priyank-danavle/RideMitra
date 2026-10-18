import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Layers, Car, Bike, AlertCircle } from 'lucide-react';
import type { VehicleType } from '@ridemitra/shared';
import { POPULAR_CITIES } from '@ridemitra/shared';

interface SearchState {
  source: string;
  destination: string;
  date: string;
  vehicleType: VehicleType;
}

export const SearchForm: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<SearchState>({
    source: '',
    destination: '',
    date: today,
    vehicleType: 'ALL',
  });

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.source.trim()) {
      setFormError('Please enter a departure source location or city.');
      return;
    }
    if (!formData.destination.trim()) {
      setFormError('Please enter an arrival destination location or city.');
      return;
    }
    if (formData.source.trim().toLowerCase() === formData.destination.trim().toLowerCase()) {
      setFormError('Source and destination cannot be identical.');
      return;
    }

    const query = new URLSearchParams();
    query.set('origin', formData.source.trim());
    query.set('destination', formData.destination.trim());
    if (formData.date) query.set('date', formData.date);
    if (formData.vehicleType !== 'ALL') query.set('vehicleType', formData.vehicleType);

    navigate(`/rides?${query.toString()}`);
  };

  return (
    <section id="search" aria-label="Find a Ride Search Form" style={{ width: '100%' }}>
      <form
        noValidate
        onSubmit={handleSubmit}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Vehicle Selection Radios */}
        <fieldset
          style={{
            border: 'none',
            padding: 0,
            margin: '0 0 1.25rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <legend className="visually-hidden">Choose vehicle mode</legend>

          {[
            { value: 'ALL' as const, label: 'All Modes', icon: <Layers size={15} /> },
            { value: 'CAR' as const, label: 'Carpool Only', icon: <Car size={15} /> },
            { value: 'BIKE' as const, label: 'Bikepool Only', icon: <Bike size={15} /> },
          ].map((mode) => (
            <label
              key={mode.value}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor:
                  formData.vehicleType === mode.value
                    ? 'var(--color-primary)'
                    : 'var(--color-border)',
                backgroundColor:
                  formData.vehicleType === mode.value
                    ? 'var(--color-primary-light)'
                    : 'transparent',
                color:
                  formData.vehicleType === mode.value
                    ? 'var(--color-primary-dark)'
                    : 'var(--color-text)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <input
                type="radio"
                name="vehicleType"
                value={mode.value}
                checked={formData.vehicleType === mode.value}
                onChange={() => setFormData((prev) => ({ ...prev, vehicleType: mode.value }))}
                className="visually-hidden"
              />
              {mode.icon}
              <span>{mode.label}</span>
            </label>
          ))}
        </fieldset>

        {/* Inputs Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Source Input */}
          <div>
            <label
              htmlFor="source-input"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                marginBottom: '0.35rem',
              }}
            >
              From (Source)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="source-input"
                type="text"
                list="popular-cities-source"
                value={formData.source}
                onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value }))}
                placeholder="e.g. Surat, Vesu, Adajan"
                className="input"
                style={{
                  width: '100%',
                  height: '48px',
                  paddingLeft: '2.5rem',
                  fontSize: '0.95rem',
                }}
              />
              <MapPin
                size={18}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <datalist id="popular-cities-source">
                {POPULAR_CITIES.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Destination Input */}
          <div>
            <label
              htmlFor="destination-input"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                marginBottom: '0.35rem',
              }}
            >
              To (Destination)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="destination-input"
                type="text"
                list="popular-cities-dest"
                value={formData.destination}
                onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
                placeholder="e.g. Ahmedabad, SG Highway"
                className="input"
                style={{
                  width: '100%',
                  height: '48px',
                  paddingLeft: '2.5rem',
                  fontSize: '0.95rem',
                }}
              />
              <MapPin
                size={18}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <datalist id="popular-cities-dest">
                {POPULAR_CITIES.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label
              htmlFor="date-input"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                marginBottom: '0.35rem',
              }}
            >
              Date of Travel
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="date-input"
                type="date"
                min={today}
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="input"
                style={{
                  width: '100%',
                  height: '48px',
                  paddingLeft: '2.5rem',
                  fontSize: '0.95rem',
                }}
              />
              <Calendar
                size={18}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                height: '48px',
                fontSize: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Search size={18} />
              <span>Find Rides</span>
            </button>
          </div>
        </div>

        {/* Error Feedback */}
        {formError && (
          <div
            role="alert"
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{formError}</span>
          </div>
        )}
      </form>
    </section>
  );
};
