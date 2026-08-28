import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Sparkles, ShieldCheck, GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if redirected due to expired session
  const queryParams = new URLSearchParams(location.search);
  const isSessionExpired = queryParams.get('session') === 'expired';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      const redirectPath = location.state?.from?.pathname || result.dashboardPath;
      navigate(redirectPath, { replace: true });
    } else {
      setErrorMessage(result.message || 'Failed to sign in. Please verify your credentials.');
    }
  };

  // Quick Demo fill buttons for smooth testing
  const handleQuickFill = (demoRole) => {
    if (demoRole === 'admin') {
      setEmail('admin@studygenie.com');
      setPassword('Admin@StudyGenie2026!');
    } else if (demoRole === 'teacher') {
      setEmail('sarah.teacher@studygenie.com');
      setPassword('TeacherPass123!');
    } else {
      setEmail('alex.student@studygenie.com');
      setPassword('StudentPass123!');
    }
  };

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
        className="card card-pastel-periwinkle animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem 2rem',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Header with Soft Pastel Icon */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'var(--pastel-periwinkle)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(184, 192, 255, 0.45)',
            }}
          >
            <Sparkles size={22} color="#2A3362" />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Sign in to your StudyGenie learning workspace
          </p>
        </div>

        {/* Expired Session Alert */}
        {isSessionExpired && (
          <div className="alert alert-info">
            <AlertCircle size={17} />
            <span>Your session expired. Please sign in again.</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="alert alert-error">
            <AlertCircle size={17} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div className="input-wrapper">
              <Mail className="input-icon-left" size={17} />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <div className="form-label">
              <label htmlFor="password">Password</label>
              <Link
                to="/forgot-password"
                style={{
                  color: 'var(--brand-primary)',
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Forgot password?
              </Link>
            </div>
            <div className="input-wrapper">
              <Lock className="input-icon-left" size={17} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
            style={{ marginTop: '1.5rem', height: '46px' }}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={17} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Minimal Soft Pastel Quick Demo Fill */}
        <div
          style={{
            marginTop: '1.75rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginBottom: '0.6rem',
              textAlign: 'center',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Quick Demo Autofill
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('student')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem', backgroundColor: 'var(--bg-surface)' }}
              title="Autofill Student credentials"
            >
              <BookOpen size={13} color="#2D4C8C" /> Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('teacher')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem', backgroundColor: 'var(--bg-surface)' }}
              title="Autofill Teacher credentials"
            >
              <GraduationCap size={13} color="#5D2FA3" /> Educator
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem', backgroundColor: 'var(--bg-surface)' }}
              title="Autofill Seeded Admin credentials"
            >
              <ShieldCheck size={13} color="#8A1C78" /> Admin
            </button>
          </div>
        </div>

        {/* Register Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
