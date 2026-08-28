import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Unauthorized = () => {
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
            background: 'var(--status-error-bg)',
            border: '1px solid var(--status-error-border)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <ShieldAlert size={28} color="var(--status-error-text)" />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Access Restricted
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          You do not have the required permissions to access this page.{' '}
          {user && (
            <span>
              Your current active role is <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{user.role}</strong>.
            </span>
          )}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isAuthenticated && user ? (
            <Link to={getDashboardPath(user.role)} className="btn btn-primary">
              <Home size={16} /> Return to Dashboard
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary">
              <LogIn size={16} /> Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
