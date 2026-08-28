import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, AlertCircle, Sparkles, BookOpen, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [institution, setInstitution] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      institution: institution.trim(),
    });
    setIsLoading(false);

    if (result.success) {
      navigate(result.dashboardPath, { replace: true });
    } else {
      setErrorMessage(result.message || 'Registration failed. Please try again.');
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
        className="card card-pastel-lavender animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '2.5rem 2.25rem',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Header with Soft Pastel Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'var(--pastel-lavender)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.85rem',
              boxShadow: '0 4px 12px rgba(200, 182, 255, 0.45)',
            }}
          >
            <Sparkles size={22} color="#342852" />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            Create your account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Join StudyGenie and organize your learning with AI
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="alert alert-error">
            <AlertCircle size={17} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Soft Pastel Role Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.4rem',
            padding: '0.35rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            marginBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => setRole('student')}
            style={{
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all var(--transition-fast)',
              background: role === 'student' ? 'var(--pastel-sky)' : 'transparent',
              color: role === 'student' ? '#1F2E52' : 'var(--text-secondary)',
              boxShadow: role === 'student' ? '0 2px 6px rgba(187, 208, 255, 0.5)' : 'none',
            }}
          >
            <BookOpen size={16} /> Student
          </button>
          <button
            type="button"
            onClick={() => setRole('teacher')}
            style={{
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all var(--transition-fast)',
              background: role === 'teacher' ? 'var(--pastel-mauve)' : 'transparent',
              color: role === 'teacher' ? '#3B2455' : 'var(--text-secondary)',
              boxShadow: role === 'teacher' ? '0 2px 6px rgba(231, 198, 255, 0.5)' : 'none',
            }}
          >
            <GraduationCap size={16} /> Educator
          </button>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name *
            </label>
            <div className="input-wrapper">
              <User className="input-icon-left" size={17} />
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address *
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

          {/* School / Institution (Optional) */}
          <div className="form-group">
            <label className="form-label" htmlFor="institution">
              Institution / School <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>(Optional)</span>
            </label>
            <div className="input-wrapper">
              <input
                id="institution"
                type="text"
                className="form-input no-icon"
                placeholder={role === 'teacher' ? 'e.g. Stanford University' : 'e.g. University / College'}
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password *
            </label>
            <div className="input-wrapper">
              <Lock className="input-icon-left" size={17} />
              <input
                id="password"
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
            {/* Password Strength Indicator */}
            {password && (
              <div className="strength-bar-container">
                <div className={`strength-step ${strength >= 1 ? (strength === 1 ? 'strength-weak' : strength === 2 ? 'strength-medium' : 'strength-strong') : ''}`} />
                <div className={`strength-step ${strength >= 2 ? (strength === 2 ? 'strength-medium' : 'strength-strong') : ''}`} />
                <div className={`strength-step ${strength >= 3 ? 'strength-strong' : ''}`} />
                <div className={`strength-step ${strength >= 4 ? 'strength-strong' : ''}`} />
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password *
            </label>
            <div className="input-wrapper">
              <Lock className="input-icon-left" size={17} />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
            style={{ marginTop: '1.5rem', height: '46px' }}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                Creating your account...
              </>
            ) : (
              <>
                <UserPlus size={17} />
                Register as {role === 'student' ? 'Student' : 'Educator'}
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
