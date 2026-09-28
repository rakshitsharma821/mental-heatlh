import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AmbientCanvas from '../components/three/AmbientCanvas';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Recovery modal state
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySubmitting, setRecoverySubmitting] = useState(false);

  const { user, login, recoverPassword, lockoutRemaining } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const destination = location.state?.from?.pathname || '/dashboard';

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (lockoutRemaining > 0) {
      setError(`Access locked for ${lockoutRemaining}s due to previous failed attempts.`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await login(email, password, remember);
      if (res.success) {
        navigate(destination, { replace: true });
      } else {
        setError(res.message);
        setSubmitting(false);
      }
    } catch (err) {
      setError('An unexpected error occurred during login. Please try again.');
      setSubmitting(false);
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySubmitting(true);

    try {
      const res = await recoverPassword(recoveryEmail, recoveryPhrase, newPassword);
      if (res.success) {
        setShowRecovery(false);
        setSuccessMessage('Password reset successfully. You may now log in with your new password.');
        setEmail(recoveryEmail);
        setPassword('');
        setRecoveryPhrase('');
        setNewPassword('');
      } else {
        setRecoveryError(res.message);
      }
    } catch (err) {
      setRecoveryError('Failed to verify recovery phrase. Please check your inputs.');
    } finally {
      setRecoverySubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative'
    }}>
      <AmbientCanvas count={25} speed={0.25} />

      <div className="glass-card" style={{
        maxWidth: '440px',
        width: '100%',
        position: 'relative',
        zIndex: 2,
        padding: '40px 32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✦</div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Return to your quiet space of calm and clarity.</p>
        </div>

        {successMessage && (
          <div style={{
            background: 'rgba(82, 183, 136, 0.15)',
            border: '1px solid rgba(82, 183, 136, 0.35)',
            color: 'var(--primary-dark)',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            fontWeight: 600
          }}>
            ✓ {successMessage}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {lockoutRemaining > 0 && (
          <div style={{
            background: 'rgba(246, 189, 96, 0.15)',
            border: '1px solid rgba(212, 163, 115, 0.4)',
            color: '#b07d3b',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 600
          }}>
            ⏳ Cooldown Active: {lockoutRemaining}s remaining
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@sanctuary.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting || lockoutRemaining > 0}
              required
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="input-label" style={{ margin: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? 'Hide 👁️' : 'Show 👁️'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting || lockoutRemaining > 0}
              required
              autoComplete="current-password"
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ accentColor: 'var(--accent-green)' }}
                disabled={submitting || lockoutRemaining > 0}
              />
              Remember me
            </label>

            <button
              type="button"
              onClick={() => {
                setShowRecovery(true);
                setRecoveryError('');
                setRecoveryEmail(email);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontWeight: 600,
                padding: 0
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginBottom: '20px' }}
            disabled={submitting || lockoutRemaining > 0}
          >
            {submitting ? 'Entering Sanctuary...' : lockoutRemaining > 0 ? `Locked (${lockoutRemaining}s)` : 'Log In →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          New to MindCare?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>Create an account</Link>
        </div>
      </div>

      {/* Self-Sovereign Password Recovery Modal */}
      {showRecovery && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2500,
          background: 'rgba(26, 46, 34, 0.45)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '460px',
            width: '100%',
            padding: '36px',
            position: 'relative',
            boxShadow: '0 20px 60px rgba(33, 64, 47, 0.16)',
            border: '1px solid var(--border-hover)'
          }}>
            <button
              onClick={() => setShowRecovery(false)}
              className="icon-btn-ghost"
              style={{ position: 'absolute', top: '16px', right: '16px' }}
            >
              ✕
            </button>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>🔑</div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Self-Sovereign Recovery
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Enter your registered email and the 3-word recovery phrase issued during account creation.
              </p>
            </div>

            {recoveryError && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                marginBottom: '16px'
              }}>
                {recoveryError}
              </div>
            )}

            <form onSubmit={handleRecoverySubmit}>
              <div className="input-group">
                <label className="input-label">Account Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@sanctuary.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">3-Word Seed Recovery Phrase</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. willow-river-meadow"
                  value={recoveryPhrase}
                  onChange={(e) => setRecoveryPhrase(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="input-label">New Password (min. 6 characters)</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter new secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={recoverySubmitting}
                >
                  {recoverySubmitting ? 'Verifying...' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecovery(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
