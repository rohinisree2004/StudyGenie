import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NotFound = () => {
  const { user, getDashboardPath, isAuthenticated } = useAuth();

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 75px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'var(--pastel-sky-subtle)',
            border: '1px solid #D2E1FF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <Compass size={28} color="#27407F" />
        </div>

        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--brand-primary)', marginBottom: '0.25rem' }}>
          404
        </div>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Page Not Found
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          The link you followed may be broken or the page may have been moved.
        </p>

        <Link
          to={isAuthenticated && user ? getDashboardPath(user.role) : '/login'}
          className="btn btn-primary"
        >
          <Home size={16} /> Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
