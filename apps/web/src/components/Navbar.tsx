import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, User, PlusCircle, LogOut, Menu, X, Compass, ShieldCheck, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
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
            gap: '0.65rem',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background:
                'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Car size={22} strokeWidth={2.2} />
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
            gap: '1.25rem',
          }}
          className="desktop-nav"
        >
          <Link
            to="/rides"
            style={{
              position: 'relative',
              color: isActive('/rides') ? 'var(--color-primary-dark)' : 'var(--color-text)',
              fontWeight: isActive('/rides') ? 700 : 500,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.25rem',
              transition: 'color var(--transition-fast)',
            }}
          >
            <Compass size={17} style={{ color: 'var(--color-primary)' }} />
            <span>Find Rides</span>
            {isActive('/rides') && (
              <motion.div
                layoutId="navbar-indicator"
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  left: 0,
                  right: 0,
                  height: '2.5px',
                  borderRadius: '2px',
                  backgroundColor: 'var(--color-primary)',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                style={{
                  position: 'relative',
                  color: isActive('/dashboard') ? 'var(--color-primary-dark)' : 'var(--color-text)',
                  fontWeight: isActive('/dashboard') ? 700 : 500,
                  fontSize: '0.95rem',
                  padding: '0.5rem 0.25rem',
                  transition: 'color var(--transition-fast)',
                }}
              >
                <span>Dashboard</span>
                {isActive('/dashboard') && (
                  <motion.div
                    layoutId="navbar-indicator"
                    style={{
                      position: 'absolute',
                      bottom: '0px',
                      left: 0,
                      right: 0,
                      height: '2.5px',
                      borderRadius: '2px',
                      backgroundColor: 'var(--color-primary)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
              <Link
                to="/my-bookings"
                style={{
                  position: 'relative',
                  color: isActive('/my-bookings')
                    ? 'var(--color-primary-dark)'
                    : 'var(--color-text)',
                  fontWeight: isActive('/my-bookings') ? 700 : 500,
                  fontSize: '0.95rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.25rem',
                  transition: 'color var(--transition-fast)',
                }}
              >
                <Ticket size={16} style={{ color: 'var(--color-primary)' }} />
                <span>My Bookings</span>
                {isActive('/my-bookings') && (
                  <motion.div
                    layoutId="navbar-indicator"
                    style={{
                      position: 'absolute',
                      bottom: '0px',
                      left: 0,
                      right: 0,
                      height: '2.5px',
                      borderRadius: '2px',
                      backgroundColor: 'var(--color-primary)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
              <Link
                to="/my-rides"
                style={{
                  position: 'relative',
                  color: isActive('/my-rides') ? 'var(--color-primary-dark)' : 'var(--color-text)',
                  fontWeight: isActive('/my-rides') ? 700 : 500,
                  fontSize: '0.95rem',
                  padding: '0.5rem 0.25rem',
                  transition: 'color var(--transition-fast)',
                }}
              >
                <span>My Rides</span>
                {isActive('/my-rides') && (
                  <motion.div
                    layoutId="navbar-indicator"
                    style={{
                      position: 'absolute',
                      bottom: '0px',
                      left: 0,
                      right: 0,
                      height: '2.5px',
                      borderRadius: '2px',
                      backgroundColor: 'var(--color-primary)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
              <Link
                to="/vehicles"
                style={{
                  position: 'relative',
                  color: isActive('/vehicles') ? 'var(--color-primary-dark)' : 'var(--color-text)',
                  fontWeight: isActive('/vehicles') ? 700 : 500,
                  fontSize: '0.95rem',
                  padding: '0.5rem 0.25rem',
                  transition: 'color var(--transition-fast)',
                }}
              >
                <span>My Vehicles</span>
                {isActive('/vehicles') && (
                  <motion.div
                    layoutId="navbar-indicator"
                    style={{
                      position: 'absolute',
                      bottom: '0px',
                      left: 0,
                      right: 0,
                      height: '2.5px',
                      borderRadius: '2px',
                      backgroundColor: 'var(--color-primary)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
              <Link
                to="/profile"
                style={{
                  position: 'relative',
                  color: isActive('/profile') ? 'var(--color-primary-dark)' : 'var(--color-text)',
                  fontWeight: isActive('/profile') ? 700 : 500,
                  fontSize: '0.95rem',
                  padding: '0.5rem 0.25rem',
                  transition: 'color var(--transition-fast)',
                }}
              >
                <span>Profile</span>
                {isActive('/profile') && (
                  <motion.div
                    layoutId="navbar-indicator"
                    style={{
                      position: 'absolute',
                      bottom: '0px',
                      left: 0,
                      right: 0,
                      height: '2.5px',
                      borderRadius: '2px',
                      backgroundColor: 'var(--color-primary)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'color var(--transition-fast)',
                }}
              >
                <ShieldCheck size={16} style={{ color: 'var(--color-primary)' }} />
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
                  gap: '0.45rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                }}
              >
                <User size={15} style={{ color: 'var(--color-primary)' }} />
                <span>{user?.name.split(' ')[0]}</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                style={{
                  minHeight: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>

              <Link
                to="/offer-ride"
                className="btn btn-primary"
                style={{
                  fontSize: '0.9rem',
                  padding: '0.5rem 1rem',
                  minHeight: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <PlusCircle size={16} />
                <span>Offer a Ride</span>
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
                to="/login?redirect=/offer-ride"
                className="btn btn-primary btn-sm"
                style={{
                  minHeight: '38px',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <PlusCircle size={15} />
                <span>Offer a Ride</span>
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
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Animated Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              borderTop: '1px solid var(--color-border)',
            }}
            className="mobile-drawer"
          >
            <div
              style={{
                padding: '1rem 1.5rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <Link
                to="/rides"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: '0.5rem 0',
                  fontWeight: 600,
                  color: isActive('/rides') ? 'var(--color-primary-dark)' : 'var(--color-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Compass size={18} style={{ color: 'var(--color-primary)' }} />
                Find Rides
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '0.5rem 0',
                      fontWeight: 500,
                      color: isActive('/dashboard')
                        ? 'var(--color-primary-dark)'
                        : 'var(--color-text)',
                    }}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/my-bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '0.5rem 0',
                      fontWeight: 500,
                      color: isActive('/my-bookings')
                        ? 'var(--color-primary-dark)'
                        : 'var(--color-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Ticket size={17} style={{ color: 'var(--color-primary)' }} />
                    My Bookings
                  </Link>
                  <Link
                    to="/my-rides"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '0.5rem 0',
                      fontWeight: 500,
                      color: isActive('/my-rides')
                        ? 'var(--color-primary-dark)'
                        : 'var(--color-text)',
                    }}
                  >
                    My Rides
                  </Link>
                  <Link
                    to="/vehicles"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '0.5rem 0',
                      fontWeight: 500,
                      color: isActive('/vehicles')
                        ? 'var(--color-primary-dark)'
                        : 'var(--color-text)',
                    }}
                  >
                    My Vehicles
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '0.5rem 0',
                      fontWeight: 500,
                      color: isActive('/profile')
                        ? 'var(--color-primary-dark)'
                        : 'var(--color-text)',
                    }}
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
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <LogOut size={16} />
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
                      style={{ flex: 1, textAlign: 'center' }}
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-accent"
                      style={{ flex: 1, textAlign: 'center' }}
                    >
                      Sign Up
                    </Link>
                  </div>
                </>
              )}

              <Link
                to={isAuthenticated ? '/offer-ride' : '/login?redirect=/offer-ride'}
                className="btn btn-primary"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <PlusCircle size={16} />
                Offer a Ride
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
