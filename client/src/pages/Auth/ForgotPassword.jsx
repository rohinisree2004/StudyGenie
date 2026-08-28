import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, ArrowLeft, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setDevResetUrl('');

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    const result = await forgotPassword(email.trim());
    setIsLoading(false);

    if (result.success) {
      setSuccessMessage(result.message);
      if (result.devResetToken) {
        setDevResetUrl(`/reset-password/${result.devResetToken}`);
      }
    } else {
      setErrorMessage(result.message || 'Failed to process request. Please try again.');
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
              background: 'var(--pastel-sky)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(187, 208, 255, 0.45)',
            }}
          >
            <KeyRound size={22} color="#1F2E52" />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            Reset Password
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Enter your email to receive password reset instructions
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="alert alert-error">
            <AlertCircle size={17} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="alert alert-success">
            <CheckCircle2 size={17} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Direct Dev Reset Link Helper */}
        {devResetUrl && (
          <div
            style={{
              padding: '0.9rem 1rem',
              marginBottom: '1.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--pastel-sky-subtle)',
              border: '1px solid #C4D7FF',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#273F7A', marginBottom: '0.4rem' }}>
              ⚡ Direct Reset Link:
            </div>
            <Link
              to={devResetUrl}
              className="btn btn-primary btn-block"
              style={{ fontSize: '0.825rem', padding: '0.55rem 1rem' }}
            >
              Open Reset Password Form <ExternalLink size={14} />
            </Link>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
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

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
            style={{ marginTop: '1.5rem', height: '46px' }}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                Sending instructions...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Back to login */}
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

export default ForgotPassword;
