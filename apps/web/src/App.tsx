import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageTransition } from './components/PageTransition';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { VehiclesPage } from './pages/VehiclesPage';
import { RidesPage } from './pages/RidesPage';
import { OfferRidePage } from './pages/OfferRidePage';
import { RideDetailsPage } from './pages/RideDetailsPage';
import { MyRidesPage } from './pages/MyRidesPage';
import { MyBookingsPage } from './pages/MyBookingsPage';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    } catch {
      // Ignore in environments where window.scrollTo is not implemented (e.g. jsdom)
    }
  }, [pathname]);

  return null;
};

export const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <HomePage />
            </PageTransition>
          }
        />
        <Route
          path="/rides"
          element={
            <PageTransition>
              <RidesPage />
            </PageTransition>
          }
        />
        <Route
          path="/rides/:id"
          element={
            <PageTransition>
              <RideDetailsPage />
            </PageTransition>
          }
        />
        <Route
          path="/login"
          element={
            <PageTransition>
              <LoginPage />
            </PageTransition>
          }
        />
        <Route
          path="/register"
          element={
            <PageTransition>
              <RegisterPage />
            </PageTransition>
          }
        />
        <Route
          path="/offer-ride"
          element={
            <ProtectedRoute>
              <PageTransition>
                <OfferRidePage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-rides"
          element={
            <ProtectedRoute>
              <PageTransition>
                <MyRidesPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <PageTransition>
                <MyBookingsPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PageTransition>
                <DashboardPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageTransition>
                <ProfilePage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <PageTransition>
                <VehiclesPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <ScrollToTop />
          <Navbar />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <AnimatedRoutes />
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
