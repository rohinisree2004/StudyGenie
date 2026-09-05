import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

const PublicNavbar = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password'].some(p => location.pathname.startsWith(p));

  return (
    <header className="app-header" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--pastel-lavender)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(200, 182, 255, 0.4)',
            }}
          >
            <Sparkles size={18} color="#342852" />
          </div>
          <div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Study<span style={{ color: 'var(--brand-primary)' }}>Genie</span>
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                marginTop: '-3px',
              }}
            >
              AI Learning Platform
            </span>
          </div>
        </Link>

        {/* Public Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {location.pathname !== '/login' && (
            <Link to="/login" className="btn btn-ghost" style={{ fontSize: '0.885rem' }}>
              Sign In
            </Link>
          )}
          {location.pathname !== '/register' && (
            <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.885rem' }}>
              <span>Get Started</span>
              <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default PublicNavbar;
