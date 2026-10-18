import React, { useState } from 'react';
import type { VehicleType } from '@ridemitra/shared';
import { POPULAR_CITIES } from '@ridemitra/shared';

interface SearchState {
  source: string;
  destination: string;
  date: string;
  vehicleType: VehicleType;
}

export const SearchForm: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<SearchState>({
    source: '',
    destination: '',
    date: today,
    vehicleType: 'ALL',
  });

  const [submittedQuery, setSubmittedQuery] = useState<SearchState | null>(null);
  const [isSearching, setIsSearching] = useState(false);
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

    setIsSearching(true);
    setSubmittedQuery({ ...formData });
    setIsSearching(false);
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

          {(
            [
              { value: 'ALL', label: '🚗 🏍️ All Modes' },
              { value: 'CAR', label: '🚗 Carpool Only' },
              { value: 'BIKE', label: '🏍️ Bikepool Only' },
            ] as const
          ).map((mode) => (
            <label
              key={mode.value}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                padding: '0.4rem 0.9rem',
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
              {mode.label}
            </label>
          ))}
        </fieldset>

        {/* Search Inputs Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          {/* Source Input */}
          <div
            className="form-group"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
          >
            <label
              htmlFor="source-input"
              style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}
            >
              From (Source)
            </label>
            <input
              id="source-input"
              type="text"
              placeholder="e.g. Surat or Vesu"
              value={formData.source}
              onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value }))}
              list="popular-cities-source"
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                minHeight: '48px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
            />
            <datalist id="popular-cities-source">
              {POPULAR_CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Destination Input */}
          <div
            className="form-group"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
          >
            <label
              htmlFor="destination-input"
              style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}
            >
              To (Destination)
            </label>
            <input
              id="destination-input"
              type="text"
              placeholder="e.g. Ahmedabad or SG Highway"
              value={formData.destination}
              onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
              list="popular-cities-destination"
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                minHeight: '48px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
            />
            <datalist id="popular-cities-destination">
              {POPULAR_CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Date Input */}
          <div
            className="form-group"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
          >
            <label
              htmlFor="date-input"
              style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}
            >
              Date of Travel
            </label>
            <input
              id="date-input"
              type="date"
              min={today}
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                minHeight: '48px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSearching}
              style={{
                width: '100%',
                height: '48px',
                fontSize: '1rem',
                letterSpacing: '0.01em',
              }}
            >
              {isSearching ? 'Searching...' : '🔍 Find Rides'}
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
            }}
          >
            ⚠️ {formError}
          </div>
        )}

        {/* Phase 1 Submission Feedback & Search State */}
        {submittedQuery && !isSearching && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <span className="badge badge-primary">Phase 1 Search Shell</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Target: {submittedQuery.vehicleType}
              </span>
            </div>
            <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.4rem' }}>
              Route: {submittedQuery.source} ➔ {submittedQuery.destination} ({submittedQuery.date})
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              The client-side search query has been captured and validated. In Phase 1, no mock
              rides are shown as real data. Live ride lookup connected to the MySQL relational
              database will be implemented in <strong>Phase 3 (Ride Management & Search)</strong>.
            </p>
          </div>
        )}
      </form>
    </section>
  );
};
