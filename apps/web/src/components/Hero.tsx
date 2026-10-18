import React from 'react';
import { SearchForm } from './SearchForm';

export const Hero: React.FC = () => {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #042f2e 0%, #0f766e 50%, #1e3a8a 100%)',
        color: '#ffffff',
        paddingBlock: '4.5rem 5.5rem',
      }}
    >
      {/* Subtle background glow effect */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45, 212, 191, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            maxWidth: '800px',
            marginInline: 'auto',
            textAlign: 'center',
            marginBottom: '2.5rem',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              padding: '0.35rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <span>✨ Smart Shared Mobility</span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span>City & Intercity</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: '1.25rem',
            }}
          >
            Carpooling & Bikepooling, Built for Smarter Daily Commuting
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'rgba(255, 255, 255, 0.88)',
              lineHeight: 1.6,
              maxWidth: '680px',
              marginInline: 'auto',
              marginBottom: '2rem',
            }}
          >
            Connect with verified drivers and riders travelling along your route. Share fuel
            expenses, beat peak traffic, and reduce carbon emissions across Gujarat's busiest
            commute corridors.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="#search"
              className="btn btn-primary"
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--color-primary-dark)',
                fontSize: '1rem',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              Find a Ride Now
            </a>
            <a
              id="offer-ride"
              href="#offer-ride-section"
              className="btn"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(4px)',
                fontSize: '1rem',
              }}
            >
              + Offer a Ride (Driver)
            </a>
          </div>
        </div>

        {/* Embedded Search Form */}
        <div style={{ maxWidth: '960px', marginInline: 'auto' }}>
          <SearchForm />
        </div>
      </div>
    </section>
  );
};
