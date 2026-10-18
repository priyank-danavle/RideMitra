import React from 'react';
import { Car, Bike, CheckCircle2, ShieldCheck, Scale, Leaf } from 'lucide-react';

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
                marginBottom: '1.25rem',
              }}
            >
              <Car size={28} style={{ color: 'var(--color-primary)' }} />
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
                <CheckCircle2 size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span>Ideal for 2–4 passenger groups</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span>Trunk/boot space for intercity luggage</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span>High-frequency highway corridors</span>
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
                marginBottom: '1.25rem',
              }}
            >
              <Bike size={28} style={{ color: 'var(--color-accent)' }} />
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
                <CheckCircle2 size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <span>Single pillion seat, quick coordination</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <span>Cut travel time in peak urban rush hours</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <span>Maximum cost savings for daily commuters</span>
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
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-light)',
                marginBottom: '1rem',
              }}
            >
              <ShieldCheck size={28} style={{ color: 'var(--color-primary)' }} />
            </div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Verified Community</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Driver license and government ID validation to cultivate trust and mutual safety.
            </p>
          </div>

          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#dbeafe',
                marginBottom: '1rem',
              }}
            >
              <Scale size={28} style={{ color: 'var(--color-accent)' }} />
            </div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>
              Non-Commercial Cost Sharing
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Fairly split fuel and toll expenditures without commercial surge pricing.
            </p>
          </div>

          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-success-bg)',
                marginBottom: '1rem',
              }}
            >
              <Leaf size={28} style={{ color: 'var(--color-success)' }} />
            </div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Sustainable Urban Air</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Fewer single-occupancy vehicles means reduced vehicular carbon emissions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
