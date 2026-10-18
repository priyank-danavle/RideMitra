import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const SafetyBanner: React.FC = () => {
  return (
    <section className="section" id="safety" aria-label="Safety and Trust">
      <div className="container">
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(2rem, 5vw, 3.5rem)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ maxWidth: '720px' }}>
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                marginBottom: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <ShieldCheck size={16} style={{ color: '#5eead4' }} />
              Safety & Community Trust
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                color: '#ffffff',
                marginBottom: '1rem',
              }}
            >
              Your Safety and Comfort are our Paramount Priority
            </h2>
            <p
              style={{
                color: '#cbd5e1',
                fontSize: '1.05rem',
                lineHeight: 1.6,
                marginBottom: '2rem',
              }}
            >
              RideMitra is engineered with strict safety standards. Every member of our community
              undergoes account verification to ensure transparent, respectful, and accountable
              travel.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem',
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: '#5eead4',
                    marginBottom: '0.3rem',
                  }}
                >
                  Government ID & License
                </div>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  Mandatory driving license and ID verification for all drivers offering rides.
                </p>
              </div>

              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: '#5eead4',
                    marginBottom: '0.3rem',
                  }}
                >
                  Two-Way Community Reviews
                </div>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  Honest post-trip ratings and feedback between passengers and drivers maintain
                  accountability.
                </p>
              </div>

              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: '#5eead4',
                    marginBottom: '0.3rem',
                  }}
                >
                  Transparent Vehicle Details
                </div>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  Clear vehicle model, color, registration plate, and luggage capacity displayed
                  prior to booking.
                </p>
              </div>
            </div>

            <div id="offer-ride-section" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                to="/rides"
                className="btn btn-primary"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>Find Your Route</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/offer-ride"
                className="btn btn-outline"
                style={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#ffffff',
                }}
              >
                Become a Verified Driver
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
