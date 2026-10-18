import React, { useState } from 'react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
        }}
      >
        {/* Brand Logo */}
        <a
          href="#"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.25rem',
              fontWeight: 800,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            🚗
          </div>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--color-primary-dark)',
                letterSpacing: '-0.02em',
              }}
            >
              Ride<span style={{ color: 'var(--color-accent)' }}>Mitra</span>
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main Navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
          }}
          className="desktop-nav"
        >
          <a
            href="#search"
            style={{
              color: 'var(--color-text)',
              fontWeight: 500,
              fontSize: '0.95rem',
              transition: 'color var(--transition-fast)',
            }}
          >
            Find a Ride
          </a>
          <a
            href="#city-commute"
            style={{
              color: 'var(--color-text)',
              fontWeight: 500,
              fontSize: '0.95rem',
              transition: 'color var(--transition-fast)',
            }}
          >
            City Commute
          </a>
          <a
            href="#intercity"
            style={{
              color: 'var(--color-text)',
              fontWeight: 500,
              fontSize: '0.95rem',
              transition: 'color var(--transition-fast)',
            }}
          >
            Intercity
          </a>
          <a
            href="#how-it-works"
            style={{
              color: 'var(--color-text)',
              fontWeight: 500,
              fontSize: '0.95rem',
              transition: 'color var(--transition-fast)',
            }}
          >
            How It Works
          </a>
          <a
            href="#safety"
            style={{
              color: 'var(--color-text)',
              fontWeight: 500,
              fontSize: '0.95rem',
              transition: 'color var(--transition-fast)',
            }}
          >
            Safety
          </a>
        </nav>

        {/* Right CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} className="nav-actions">
          <a
            href="#offer-ride"
            className="btn btn-primary"
            style={{
              fontSize: '0.95rem',
              padding: '0.6rem 1.25rem',
            }}
          >
            + Offer a Ride
          </a>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="btn btn-outline mobile-menu-btn"
            style={{
              display: 'none',
              padding: '0.5rem',
              minHeight: '40px',
              width: '40px',
            }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            padding: '1rem 1.5rem 1.5rem',
            backgroundColor: '#ffffff',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
          className="mobile-drawer"
        >
          <a
            href="#search"
            onClick={() => setMobileMenuOpen(false)}
            style={{ padding: '0.5rem 0', fontWeight: 500 }}
          >
            Find a Ride
          </a>
          <a
            href="#city-commute"
            onClick={() => setMobileMenuOpen(false)}
            style={{ padding: '0.5rem 0', fontWeight: 500 }}
          >
            City Commute
          </a>
          <a
            href="#intercity"
            onClick={() => setMobileMenuOpen(false)}
            style={{ padding: '0.5rem 0', fontWeight: 500 }}
          >
            Intercity Travel
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            style={{ padding: '0.5rem 0', fontWeight: 500 }}
          >
            How It Works
          </a>
          <a
            href="#safety"
            onClick={() => setMobileMenuOpen(false)}
            style={{ padding: '0.5rem 0', fontWeight: 500 }}
          >
            Safety & Trust
          </a>
          <a
            href="#offer-ride"
            className="btn btn-primary"
            onClick={() => setMobileMenuOpen(false)}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            + Offer a Ride
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
};
