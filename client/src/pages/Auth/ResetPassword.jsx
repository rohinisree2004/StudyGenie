import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
  const { resettoken } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    const result = await resetPassword(resettoken, password);
    setIsLoading(false);

    if (result.success) {
      navigate(result.dashboardPath, { replace: true });
    } else {
      setErrorMessage(result.message || 'Password reset token is invalid or has expired.');
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
        className="card card-pastel-sky animate-fade-in"
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
              background: 'var(--pastel-lavender)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(200, 182, 255, 0.45)',
            }}
          >
            <ShieldCheck size={22} color="#342852" />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            Set New Password
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Create a secure new password for your account
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="alert alert-error">
            <AlertCircle size={17} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">
              New Password
            </label>
            <div className="input-wrapper">
              <Lock className="input-icon-left" size={17} />
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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

          {/* Confirm New Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmNewPassword">
              Confirm New Password
            </label>
            <div className="input-wrapper">
              <Lock className="input-icon-left" size={17} />
              <input
                id="confirmNewPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
            style={{ marginTop: '1.5rem', height: '46px' }}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                Updating password...
              </>
            ) : (
              'Reset Password & Sign In'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
