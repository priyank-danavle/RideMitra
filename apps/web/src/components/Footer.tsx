import React from 'react';
import { HealthStatusBadge } from './HealthStatusBadge';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        borderTop: '1px solid #1e293b',
        paddingBlock: '4rem 2rem',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem',
          }}
        >
          {/* Brand Column */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '1rem',
                }}
              >
                🚗
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#ffffff',
                }}
              >
                Ride<span style={{ color: 'var(--color-accent)' }}>Mitra</span>
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              A responsive, community-driven carpooling and bikepooling platform connecting
              commuters across Gujarat and western India for economical, eco-friendly shared travel.
            </p>
            <div>
              <HealthStatusBadge />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              style={{
                color: '#ffffff',
                fontSize: '0.95rem',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Explore
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                fontSize: '0.875rem',
              }}
            >
              <li>
                <a href="#search" style={{ color: '#cbd5e1' }}>
                  Find a Ride
                </a>
              </li>
              <li>
                <a href="#city-commute" style={{ color: '#cbd5e1' }}>
                  City Commuting
                </a>
              </li>
              <li>
                <a href="#intercity" style={{ color: '#cbd5e1' }}>
                  Intercity Travel
                </a>
              </li>
              <li>
                <a href="#how-it-works" style={{ color: '#cbd5e1' }}>
                  How it Works
                </a>
              </li>
              <li>
                <a href="#safety" style={{ color: '#cbd5e1' }}>
                  Safety & Guidelines
                </a>
              </li>
            </ul>
          </div>

          {/* Transit Hubs */}
          <div>
            <h4
              style={{
                color: '#ffffff',
                fontSize: '0.95rem',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Regional Corridors
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                fontSize: '0.875rem',
              }}
            >
              <li>Surat ⇄ Ahmedabad</li>
              <li>Vadodara ⇄ Ahmedabad</li>
              <li>Surat ⇄ Vadodara</li>
              <li>Ahmedabad ⇄ Gandhinagar</li>
              <li>Surat ⇄ Mumbai</li>
            </ul>
          </div>

          {/* Project Phase Status */}
          <div>
            <h4
              style={{
                color: '#ffffff',
                fontSize: '0.95rem',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Engineering Milestone
            </h4>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              <strong>Phase 1: Foundation & Shell.</strong> Monorepo architecture, typed API client,
              accessible UI, and automated CI pipelines are active.
            </p>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Next: Phase 2 (Authentication & User Profiles).
            </p>
          </div>
        </div>

        {/* Bottom Legal / Disclaimer */}
        <div
          style={{
            borderTop: '1px solid #1e293b',
            paddingTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.8rem',
            color: '#64748b',
          }}
        >
          <div>
            © {new Date().getFullYear()} RideMitra. All rights reserved. Built with clean
            architecture principles.
          </div>
          <div>Non-commercial cost-sharing platform. Not a commercial taxi service.</div>
        </div>
      </div>
    </footer>
  );
};
