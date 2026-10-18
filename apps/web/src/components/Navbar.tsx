import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
        <Link
          to="/"
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
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main Navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.75rem',
          }}
          className="desktop-nav"
        >
          <Link
            to="/"
            style={{
              color: 'var(--color-text)',
              fontWeight: 500,
              fontSize: '0.95rem',
              transition: 'color var(--transition-fast)',
            }}
          >
            Find a Ride
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                style={{
                  color: 'var(--color-text)',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  transition: 'color var(--transition-fast)',
                }}
              >
                Dashboard
              </Link>
              <Link
                to="/vehicles"
                style={{
                  color: 'var(--color-text)',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  transition: 'color var(--transition-fast)',
                }}
              >
                My Vehicles
              </Link>
              <Link
                to="/profile"
                style={{
                  color: 'var(--color-text)',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  transition: 'color var(--transition-fast)',
                }}
              >
                Profile
              </Link>
            </>
          ) : (
            <>
              <a
                href="/#city-commute"
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
                href="/#intercity"
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
                href="/#how-it-works"
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
                href="/#safety"
                style={{
                  color: 'var(--color-text)',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  transition: 'color var(--transition-fast)',
                }}
              >
                Safety
              </a>
            </>
          )}
        </nav>

        {/* Right CTA / Auth Buttons */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          className="nav-actions"
        >
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                }}
              >
                <span>👤</span>
                <span>{user?.name.split(' ')[0]}</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                style={{ minHeight: '36px' }}
              >
                Sign Out
              </button>

              <Link
                to="/vehicles"
                className="btn btn-primary"
                style={{
                  fontSize: '0.9rem',
                  padding: '0.5rem 1rem',
                  minHeight: '36px',
                }}
              >
                + Offer a Ride
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-outline btn-sm"
                style={{ minHeight: '38px', fontSize: '0.9rem' }}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="btn btn-accent btn-sm"
                style={{ minHeight: '38px', fontSize: '0.9rem' }}
              >
                Sign Up
              </Link>
              <Link
                to="/login?redirect=/vehicles"
                className="btn btn-primary btn-sm"
                style={{ minHeight: '38px', fontSize: '0.9rem' }}
              >
                + Offer a Ride
              </Link>
            </>
          )}

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
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{ padding: '0.5rem 0', fontWeight: 500 }}
          >
            Find a Ride
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '0.5rem 0', fontWeight: 500 }}
              >
                Dashboard
              </Link>
              <Link
                to="/vehicles"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '0.5rem 0', fontWeight: 500 }}
              >
                My Vehicles
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '0.5rem 0', fontWeight: 500 }}
              >
                My Profile
              </Link>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <a
                href="/#city-commute"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '0.5rem 0', fontWeight: 500 }}
              >
                City Commute
              </a>
              <a
                href="/#intercity"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '0.5rem 0', fontWeight: 500 }}
              >
                Intercity Travel
              </a>
              <a
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '0.5rem 0', fontWeight: 500 }}
              >
                How It Works
              </a>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-accent"
                  style={{ flex: 1 }}
                >
                  Sign Up
                </Link>
              </div>
            </>
          )}

          <Link
            to={isAuthenticated ? '/vehicles' : '/login?redirect=/vehicles'}
            className="btn btn-primary"
            onClick={() => setMobileMenuOpen(false)}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            + Offer a Ride
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
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
