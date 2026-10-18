import React, { useState } from 'react';

export const HowItWorks: React.FC = () => {
  const [activeRole, setActiveRole] = useState<'passenger' | 'driver'>('passenger');

  return (
    <section className="section section-subtle" id="how-it-works" aria-label="How RideMitra Works">
      <div className="container">
        <div className="section-header">
          <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>
            Simple & Transparent
          </span>
          <h2>How RideMitra Works</h2>
          <p>
            Whether you are booking a seat or sharing your empty car or bike space, coordination is
            seamless.
          </p>

          {/* Role Toggle Tabs */}
          <div
            role="tablist"
            aria-label="User role selection"
            style={{
              display: 'inline-flex',
              backgroundColor: '#e2e8f0',
              padding: '0.3rem',
              borderRadius: 'var(--radius-full)',
              marginTop: '1.5rem',
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeRole === 'passenger'}
              onClick={() => setActiveRole('passenger')}
              style={{
                border: 'none',
                background: activeRole === 'passenger' ? '#ffffff' : 'transparent',
                color:
                  activeRole === 'passenger'
                    ? 'var(--color-primary-dark)'
                    : 'var(--color-text-muted)',
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                boxShadow: activeRole === 'passenger' ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              For Passengers
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeRole === 'driver'}
              onClick={() => setActiveRole('driver')}
              style={{
                border: 'none',
                background: activeRole === 'driver' ? '#ffffff' : 'transparent',
                color:
                  activeRole === 'driver' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                boxShadow: activeRole === 'driver' ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              For Drivers
            </button>
          </div>
        </div>

        {activeRole === 'passenger' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
            }}
          >
            <div className="card">
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>1️⃣</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Search Your Route</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Enter your pickup area, destination, and travel date. Filter by Carpool for comfort
                or Bikepool for agile city micro-commutes.
              </p>
            </div>

            <div className="card">
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>2️⃣</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Request a Seat</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Review driver profiles, vehicle details, ratings, and shared contribution amount.
                Submit your booking request securely.
              </p>
            </div>

            <div className="card">
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>3️⃣</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Ride & Share Cost</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Meet at the agreed pickup point, travel safely together, and split fuel costs
                directly and transparently.
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
            }}
          >
            <div className="card">
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>1️⃣</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Publish Your Ride</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Specify your route, departure time, empty seat count, vehicle type (car or bike),
                and non-commercial fuel contribution amount.
              </p>
            </div>

            <div className="card">
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>2️⃣</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Approve Passengers</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Review passenger booking requests and profiles. You retain full autonomy to accept
                or decline requests based on your preferences.
              </p>
            </div>

            <div className="card">
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>3️⃣</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Drive & Offset Fuel</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Pick up verified passengers along your daily route. Offset up to 70% of your weekly
                fuel and toll expenses.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
