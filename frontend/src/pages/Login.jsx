// ============================================
// MindCare — Unified Multi-Role Authentication Portal
// Supports 3 Distinct Portals:
// 1. Sanctuary Member (Normal User) -> /welcome
// 2. Clinical Practitioner (Therapist ID + Email + Password) -> /therapist
// 3. System Administrator (Admin ID + Password + Access Code) -> /admin
// With Self-Service Password / Therapist ID Recovery via Verified Email OTP
// ============================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Api } from '../services/api';

const PORTALS = {
  member: {
    id: 'member',
    tabLabel: 'User',
    title: 'User',
    tag: 'Ages 20–25',
    icon: '🌿',
    header: 'User Login',
    subtitle: 'Enter your Email or User ID (MC-XXXXXX) to access your reflection space.',
    primaryColor: '#52b788',
    borderColor: 'rgba(82, 183, 136, 0.45)',
    bgActive: 'rgba(82, 183, 136, 0.12)',
    destination: '/welcome'
  },
  therapist: {
    id: 'therapist',
    tabLabel: 'Therapist',
    title: 'Therapist',
    tag: 'Licensed Clinician',
    icon: '🩺',
    header: 'Therapist Login',
    subtitle: 'Sign in with your Therapist ID (THR-XXXXXX), registered email, and clinical password.',
    primaryColor: '#2b5f7d',
    borderColor: 'rgba(43, 95, 125, 0.45)',
    bgActive: 'rgba(43, 95, 125, 0.12)',
    destination: '/therapist'
  },
  admin: {
    id: 'admin',
    tabLabel: 'Admin',
    title: 'Admin',
    tag: 'Governance',
    icon: '🛡️',
    header: 'Admin Console Login',
    subtitle: 'Sign in with your Admin ID (ADM-XXXXXX), password, and confidential access code.',
    primaryColor: '#8e44ad',
    borderColor: 'rgba(142, 68, 173, 0.45)',
    bgActive: 'rgba(142, 68, 173, 0.12)',
    destination: '/admin'
  }
};

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, verifyOtp, lockoutRemaining } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const requestedPortal = searchParams.get('portal');
  const [activePortal, setActivePortal] = useState(
    PORTALS[requestedPortal] ? requestedPortal : 'member'
  );

  // Form Fields
  const [identifier, setIdentifier] = useState(''); // Member: Email or MC-ID
  const [therapistId, setTherapistId] = useState(''); // Therapist: THR-XXXXXX
  const [therapistEmail, setTherapistEmail] = useState('');
  const [adminId, setAdminId] = useState(''); // Admin: ADM-XXXXXX
  const [accessCode, setAccessCode] = useState(''); // Admin access code
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // OTP Step (if 2FA enabled)
  const [otpStep, setOtpStep] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [maskedDestination, setMaskedDestination] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // ── RECOVERY MODAL STATE ──
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: Email, 2: OTP, 3: Reset / Change ID
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryChallengeId, setRecoveryChallengeId] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveredTherapistId, setRecoveredTherapistId] = useState('');
  const [newTherapistId, setNewTherapistId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoverySubmitting, setRecoverySubmitting] = useState(false);

  // Route user according to role
  const routeUserByRole = (authenticatedUser) => {
    const role = authenticatedUser?.role;
    if (role === 'admin' || role === 'super_admin') {
      navigate('/admin', { replace: true });
    } else if (role === 'therapist') {
      navigate('/therapist', { replace: true });
    } else {
      navigate('/welcome', { replace: true });
    }
  };

  useEffect(() => {
    if (user && !otpStep) {
      routeUserByRole(user);
    }
  }, [user, otpStep]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let credentials = { portal: activePortal, remember };

      if (activePortal === 'therapist') {
        credentials.therapistId = therapistId.trim().toUpperCase();
        credentials.email = therapistEmail.trim().toLowerCase();
        credentials.password = password;
      } else if (activePortal === 'admin') {
        credentials.adminId = adminId.trim().toUpperCase();
        credentials.accessCode = accessCode.trim();
        credentials.password = password;
      } else {
        credentials.identifier = identifier.trim();
        credentials.password = password;
      }

      const res = await login(credentials, password, remember);

      if (res.requiresOtp) {
        setOtpStep(true);
        setChallengeId(res.challenge_id);
        setMaskedDestination(res.destination || 'your registered contact');
        setSubmitting(false);
        return;
      }

      if (res.success) {
        routeUserByRole(res.user);
      } else {
        setError(res.message || "These details don't match. Please try again.");
      }
    } catch (err) {
      setError("These details don't match. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await verifyOtp(challengeId, otpCode, remember);
      if (res.success) {
        routeUserByRole(res.user);
      } else {
        setError(res.message || 'Incorrect verification code.');
      }
    } catch (err) {
      setError('Verification error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── RECOVERY HANDLERS ──
  const openRecoveryModal = () => {
    if (activePortal === 'admin') {
      setError('Self-service recovery is disabled for administrator accounts. Please contact your Super Administrator.');
      return;
    }
    setShowRecovery(true);
    setRecoveryStep(1);
    setRecoveryError('');
    setRecoverySuccess('');
    setRecoveryEmail('');
    setRecoveryOtp('');
    setRecoveredTherapistId('');
    setNewTherapistId('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleRequestRecoveryOtp = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySubmitting(true);
    try {
      const res = await Api.requestRecoveryOtp(recoveryEmail, activePortal === 'therapist' ? 'therapist' : 'client');
      if (res.success) {
        setRecoveryChallengeId(res.challenge_id);
        setRecoveryStep(2);
      } else {
        setRecoveryError(res.message || 'Failed to dispatch recovery code.');
      }
    } catch (_) {
      setRecoveryError('Server error dispatching recovery code.');
    } finally {
      setRecoverySubmitting(false);
    }
  };

  const handleVerifyRecoveryOtp = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySubmitting(true);
    try {
      const res = await Api.verifyRecoveryOtp(recoveryChallengeId, recoveryOtp);
      if (res.success && res.verified) {
        if (res.therapistId) {
          setRecoveredTherapistId(res.therapistId);
          setNewTherapistId(res.therapistId);
        }
        setRecoveryStep(3);
      } else {
        setRecoveryError(res.message || 'Incorrect recovery verification code.');
      }
    } catch (_) {
      setRecoveryError('Verification error.');
    } finally {
      setRecoverySubmitting(false);
    }
  };

  const handleCompleteRecovery = async (e) => {
    e.preventDefault();
    setRecoveryError('');

    if (newPassword && newPassword !== confirmNewPassword) {
      setRecoveryError('Passwords do not match.');
      return;
    }

    setRecoverySubmitting(true);
    try {
      const payload = { challenge_id: recoveryChallengeId };
      if (newPassword) payload.newPassword = newPassword;
      if (activePortal === 'therapist' && newTherapistId && newTherapistId !== recoveredTherapistId) {
        payload.newTherapistId = newTherapistId.trim().toUpperCase();
      }

      const res = await Api.completeRecovery(payload);
      if (res.success) {
        setRecoverySuccess('Credentials updated successfully! You may now sign in.');
        setTimeout(() => {
          setShowRecovery(false);
          if (activePortal === 'therapist' && newTherapistId) {
            setTherapistId(newTherapistId);
            setTherapistEmail(recoveryEmail);
          } else if (recoveryEmail) {
            setIdentifier(recoveryEmail);
          }
        }, 1800);
      } else {
        setRecoveryError(res.message || 'Failed to update credentials.');
      }
    } catch (_) {
      setRecoveryError('Server error completing recovery.');
    } finally {
      setRecoverySubmitting(false);
    }
  };

  const currentPortalConfig = PORTALS[activePortal];

  return (
    <div className="auth-page" style={{ padding: '40px 20px 80px', minHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '40px 32px', borderRadius: '24px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            {currentPortalConfig.icon}
          </div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
            {currentPortalConfig.header}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {currentPortalConfig.subtitle}
          </p>
        </div>

        {/* 3 Portal Selection Tabs */}
        {!otpStep && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '6px',
            padding: '4px',
            background: 'var(--bg-surface-elevated, rgba(0,0,0,0.03))',
            borderRadius: '14px',
            marginBottom: '26px'
          }}>
            {Object.values(PORTALS).map((p) => {
              const isActive = activePortal === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setActivePortal(p.id);
                    setError('');
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? p.primaryColor : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <span>{p.icon}</span>
                  <span>{p.tabLabel || p.title}</span>
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#dc2626',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '0.86rem',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* ── STANDARD LOGIN FORM ── */}
        {!otpStep ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 1. Member Fields */}
            {activePortal === 'member' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Login ID (Email or MC-XXXXXX User ID)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. alex@example.com or MC-8F92A1"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            )}

            {/* 2. Therapist Fields */}
            {activePortal === 'therapist' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Therapist ID (THR-XXXXXX)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. THR-9B42A1"
                    value={therapistId}
                    onChange={(e) => setTherapistId(e.target.value.toUpperCase())}
                    style={{ letterSpacing: '1px', fontWeight: 700 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Registered Clinician Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="dr.sarah@clinic.org"
                    value={therapistEmail}
                    onChange={(e) => setTherapistEmail(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* 3. Admin Fields */}
            {activePortal === 'admin' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Admin Identifier (ADM-XXXXXX)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. ADM-7B29F4"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value.toUpperCase())}
                    style={{ letterSpacing: '1px', fontWeight: 700 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Confidential Access Code
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="ADM-CODE-XXXX"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    style={{ letterSpacing: '2px', fontWeight: 700 }}
                    required
                  />
                </div>
              </>
            )}

            {/* Password Field (Common to all) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Password
                </label>
                {activePortal !== 'admin' && (
                  <button
                    type="button"
                    onClick={openRecoveryModal}
                    style={{ background: 'none', border: 'none', color: currentPortalConfig.primaryColor, fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {activePortal === 'therapist' ? 'Forgot Therapist ID / Password?' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                Show password
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || lockoutRemaining > 0}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '10px',
                background: currentPortalConfig.primaryColor,
                borderColor: currentPortalConfig.primaryColor
              }}
            >
              {submitting ? 'Authenticating...' : `Log In as ${currentPortalConfig.tabLabel || currentPortalConfig.title} →`}
            </button>
          </form>
        ) : (
          /* ── OTP VERIFICATION STEP ── */
          <form onSubmit={handleOtpVerify} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔐</div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px' }}>Two-Factor Security Code</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                A 6-digit verification code has been dispatched to <strong>{maskedDestination}</strong>.
              </p>
            </div>

            <input
              type="text"
              maxLength="6"
              className="input-field"
              placeholder="123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              style={{ textAlign: 'center', fontSize: '1.6rem', letterSpacing: '6px', fontWeight: 800 }}
              required
            />

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || otpCode.length < 6}
              style={{ width: '100%', padding: '14px', background: currentPortalConfig.primaryColor }}
            >
              {submitting ? 'Verifying Code...' : 'Verify & Enter Sanctuary →'}
            </button>

            <button
              type="button"
              className="btn-ghost"
              onClick={() => setOtpStep(false)}
              style={{ width: '100%', padding: '10px' }}
            >
              ← Back to Login Credentials
            </button>
          </form>
        )}

        {/* ── BOTTOM SWITCH / REGISTER BANNER (Hidden on Admin portal) ── */}
        {activePortal !== 'admin' && (
          <div style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-glass, rgba(0,0,0,0.06))',
            textAlign: 'center',
            fontSize: '0.88rem'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>New to MindCare Sanctuary? </span>
            <Link
              to={activePortal === 'therapist' ? '/register?portal=therapist' : '/register?portal=member'}
              style={{ fontWeight: 700, color: currentPortalConfig.primaryColor, textDecoration: 'none' }}
            >
              Create an account here →
            </Link>
          </div>
        )}

      </div>

      {/* ── SELF-SERVICE RECOVERY MODAL (Therapist ID / Password Reset via OTP) ── */}
      {showRecovery && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '36px 28px', borderRadius: '20px', background: 'var(--bg-card, #ffffff)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
                {activePortal === 'therapist' ? '🩺 Therapist ID & Credential Recovery' : '🌿 Account Password Recovery'}
              </h3>
              <button
                type="button"
                onClick={() => setShowRecovery(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ×
              </button>
            </div>

            {recoveryError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '16px' }}>
                {recoveryError}
              </div>
            )}

            {recoverySuccess && (
              <div style={{ background: 'rgba(82, 183, 136, 0.15)', color: '#2d6a4f', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600 }}>
                {recoverySuccess}
              </div>
            )}

            {/* Step 1: Enter Email */}
            {recoveryStep === 1 && (
              <form onSubmit={handleRequestRecoveryOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5 }}>
                  Enter your registered email address. We will dispatch a 6-digit verification code to confirm your identity.
                </p>
                <input
                  type="email"
                  className="input-field"
                  placeholder="your.email@example.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={recoverySubmitting}
                  style={{ width: '100%', padding: '12px', background: currentPortalConfig.primaryColor }}
                >
                  {recoverySubmitting ? 'Sending Code...' : 'Send Recovery Code →'}
                </button>
              </form>
            )}

            {/* Step 2: Enter OTP */}
            {recoveryStep === 2 && (
              <form onSubmit={handleVerifyRecoveryOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5 }}>
                  Enter the 6-digit recovery code sent to <strong>{recoveryEmail}</strong>:
                </p>
                <input
                  type="text"
                  maxLength="6"
                  className="input-field"
                  placeholder="123456"
                  value={recoveryOtp}
                  onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '4px', fontWeight: 700 }}
                  required
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={recoverySubmitting || recoveryOtp.length < 6}
                  style={{ width: '100%', padding: '12px', background: currentPortalConfig.primaryColor }}
                >
                  {recoverySubmitting ? 'Verifying Code...' : 'Verify Code →'}
                </button>
              </form>
            )}

            {/* Step 3: View/Update Therapist ID & Set New Password */}
            {recoveryStep === 3 && (
              <form onSubmit={handleCompleteRecovery} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* For Therapist: Show Current Therapist ID + Option to Rotate */}
                {activePortal === 'therapist' && (
                  <div style={{
                    background: 'var(--bg-surface-elevated, #f0f7fa)',
                    border: '1px solid rgba(43, 95, 125, 0.3)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '4px'
                  }}>
                    <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                      Your Current Therapist ID
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2b5f7d', letterSpacing: '2px', margin: '4px 0' }}>
                      {recoveredTherapistId}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      You can keep this ID or customize a new Therapist ID below:
                    </div>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. THR-NEWCODE"
                      value={newTherapistId}
                      onChange={(e) => setNewTherapistId(e.target.value.toUpperCase())}
                      style={{ marginTop: '8px', letterSpacing: '1px', fontWeight: 700 }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={recoverySubmitting || !newPassword}
                  style={{ width: '100%', padding: '12px', background: currentPortalConfig.primaryColor }}
                >
                  {recoverySubmitting ? 'Updating Credentials...' : 'Save & Update Credentials →'}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
