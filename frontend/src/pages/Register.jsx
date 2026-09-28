import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AmbientCanvas from '../components/three/AmbientCanvas';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Recovery seed phrase presentation state
  const [createdPhrase, setCreatedPhrase] = useState(null);
  const [copiedPhrase, setCopiedPhrase] = useState(false);

  const { user, register } = useAuth();
  const navigate = useNavigate();

  // If already authenticated and not in recovery dialog, redirect
  useEffect(() => {
    if (user && !createdPhrase) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, createdPhrase, navigate]);

  const getPasswordStrength = () => {
    if (!password) return { label: '', percent: 0, color: 'var(--text-muted)' };
    let score = 0;
    if (password.length >= 6) score += 33;
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score += 34;
    if (/[^A-Za-z0-9]/.test(password) && password.length >= 8) score += 33;

    if (score < 40) return { label: 'Gentle / Weak', percent: 33, color: '#dc2626' };
    if (score < 75) return { label: 'Moderate', percent: 66, color: '#d97706' };
    return { label: 'Strong & Safe', percent: 100, color: '#2d6a4f' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both entries.');
      return;
    }

    if (!agree) {
      setError('Please acknowledge the client-side privacy notice to proceed.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await register(email, password, name);
      if (res.success) {
        // Display recovery seed phrase modal before navigating to dashboard
        setCreatedPhrase(res.recoveryPhrase);
      } else {
        setError(res.message);
        setSubmitting(false);
      }
    } catch (err) {
      setError('An unexpected error occurred during account creation.');
      setSubmitting(false);
    }
  };

  const handleCopyPhrase = () => {
    if (createdPhrase) {
      navigator.clipboard.writeText(createdPhrase).catch(() => {});
      setCopiedPhrase(true);
      setTimeout(() => setCopiedPhrase(false), 2000);
    }
  };

  const handleProceedToSanctuary = () => {
    navigate('/dashboard');
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
        maxWidth: '460px',
        width: '100%',
        position: 'relative',
        zIndex: 2,
        padding: '40px 32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌱</div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Begin Your Sanctuary</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Create a safe, private space tailored to your emotional rhythm.</p>
        </div>

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

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Preferred Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="How may we address you?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@sanctuary.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
              autoComplete="username"
            />
          </div>

          <div className="input-group" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="input-label" style={{ margin: 0 }}>Password (min. 6 characters)</label>
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
              placeholder="Create a calm, secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="input-group" style={{ marginBottom: '14px' }}>
            <label className="input-label">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="Re-type your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
              required
              autoComplete="new-password"
            />
          </div>

          {password && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Security Level:</span>
                <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(64, 145, 108, 0.15)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${strength.percent}%`, height: '100%', background: strength.color, transition: 'all 0.3s' }}></div>
              </div>
            </div>
          )}

          {/* Privacy Consent Step */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '24px',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)'
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                style={{ accentColor: 'var(--accent-green)', marginTop: '3px' }}
                disabled={submitting}
              />
              <span>
                I understand MindCare operates with <strong>client-side local storage</strong>. My journal reflections and mood records stay strictly on this device.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginBottom: '20px' }}
            disabled={submitting}
          >
            {submitting ? 'Creating Sanctuary...' : 'Create Account →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Log In</Link>
        </div>
      </div>

      {/* Emergency Recovery Phrase Presentation Modal */}
      {createdPhrase && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2600,
          background: 'rgba(26, 46, 34, 0.55)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '36px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(33, 64, 47, 0.2)',
            border: '1px solid var(--primary)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔐</div>
            <h3 style={{ fontSize: '1.45rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Your Sovereign Recovery Seed
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Because MindCare does not send your data to remote cloud servers, this 3-word phrase is your <strong>only</strong> key to reset your password if you ever forget it.
            </p>

            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '2px dashed var(--primary)',
              borderRadius: '14px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--primary-dark)',
              letterSpacing: '1px',
              marginBottom: '18px'
            }}>
              {createdPhrase}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={handleCopyPhrase}
                className="btn-ghost"
                style={{ fontSize: '0.82rem', padding: '8px 18px' }}
              >
                {copiedPhrase ? 'Copied to Clipboard! ✓' : 'Copy Phrase 📋'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleProceedToSanctuary}
              className="btn-primary"
              style={{ width: '100%', padding: '12px 24px' }}
            >
              I Have Saved My Phrase — Enter Sanctuary 🌿
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
