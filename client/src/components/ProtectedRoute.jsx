import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from './Layout/AppLayout';

/**
 * ProtectedRoute Component
 * - Checks if user is authenticated
 * - Verifies if user has one of the allowed roles
 * - Renders AppLayout with responsive sidebar, header, and mobile drawer
 * - Handles loading state gracefully
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <div className="spinner spinner-dark" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>
          Verifying session & permissions...
        </p>
      </div>
    );
  }

  // Not logged in -> Redirect to login with intended return location
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <AppLayout />;
};

export default ProtectedRoute;
