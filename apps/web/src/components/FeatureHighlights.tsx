import React from 'react';

export const FeatureHighlights: React.FC = () => {
  return (
    <section className="section" id="modes" aria-label="Ride Modes and Principles">
      <div className="container">
        <div className="section-header">
          <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>
            Shared Mobility Reimagined
          </span>
          <h2>Two Travel Modes, One Unified Platform</h2>
          <p>
            Whether you are commuting across the city or heading to another city for the weekend,
            RideMitra adapts to your vehicle preference and commute style.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            marginBottom: '3.5rem',
          }}
        >
          {/* Carpooling Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-primary-light)',
                fontSize: '1.75rem',
                marginBottom: '1.25rem',
              }}
            >
              🚗
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <h3 style={{ fontSize: '1.35rem' }}>Carpooling</h3>
              <span className="badge badge-primary">Multiple Seats</span>
            </div>
            <p
              style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}
            >
              Share empty car seats on daily city commutes or long-distance intercity highways.
              Split fuel and toll costs fairly while enjoying air conditioning and luggage space.
            </p>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                marginTop: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                fontSize: '0.9rem',
                color: 'var(--color-text)',
              }}
            >
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-primary)' }}>✓</span> Ideal for 2–4 passenger
                groups
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-primary)' }}>✓</span> Trunk/boot space for
                intercity luggage
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-primary)' }}>✓</span> High-frequency highway
                corridors
              </li>
            </ul>
          </div>

          {/* Bikepooling Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#dbeafe',
                fontSize: '1.75rem',
                marginBottom: '1.25rem',
              }}
            >
              🏍️
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <h3 style={{ fontSize: '1.35rem' }}>Bikepooling</h3>
              <span
                className="badge badge-outline"
                style={{ borderColor: '#93c5fd', color: '#1d4ed8' }}
              >
                Fast & Micro-Commute
              </span>
            </div>
            <p
              style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}
            >
              The most agile, budget-friendly way to commute through congested city traffic. Connect
              with two-wheeler riders heading toward the same office park, college campus, or metro
              hub.
            </p>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                marginTop: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                fontSize: '0.9rem',
                color: 'var(--color-text)',
              }}
            >
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-accent)' }}>✓</span> Single pillion seat, quick
                coordination
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-accent)' }}>✓</span> Cut travel time in peak
                urban rush hours
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-accent)' }}>✓</span> Maximum cost savings for
                daily commuters
              </li>
            </ul>
          </div>
        </div>

        {/* Core Principles Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🛡️</div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Verified Community</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Driver license and government ID validation to cultivate trust and mutual safety.
            </p>
          </div>
          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚖️</div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>
              Non-Commercial Cost Sharing
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Fairly split fuel and toll expenditures without commercial surge pricing.
            </p>
          </div>
          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🌱</div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Sustainable Urban Air</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Fewer single-occupancy vehicles means reduced vehicular carbon emissions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
