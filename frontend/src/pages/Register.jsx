// ============================================
// MindCare Sanctuary — Multi-Role Registration Portal
// Default Entry Screen: Register first, with login switch below
// Portals: 1. Sanctuary Member (20-25)  2. Clinical Practitioner
// ============================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Api } from '../services/api';
import { CLINICAL_CONFIG } from '../config/clinicalConfig';

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, register } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const requestedPortal = searchParams.get('portal');
  const [activePortal, setActivePortal] = useState(
    requestedPortal === 'therapist' ? 'therapist' : 'member'
  );

  // Common & Client Member Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [agree, setAgree] = useState(true);

  // Therapist Specific Fields (Part 3)
  const [therapistType, setTherapistType] = useState(CLINICAL_CONFIG.therapistTypes[0]);
  const [therapistTitle, setTherapistTitle] = useState('Licensed Clinical Psychologist');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licensingBoard, setLicensingBoard] = useState(CLINICAL_CONFIG.licensingBodies[0]);
  const [mobileNumber, setMobileNumber] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(3);
  const [selectedSpecialties, setSelectedSpecialties] = useState(['Anxiety & Panic', 'Work & Academic Stress']);
  const [selectedSkills, setSelectedSkills] = useState(['Cognitive Behavioral Therapy (CBT)', 'Mindfulness-Based Stress Reduction (MBSR)']);
  const [degrees, setDegrees] = useState([
    { degree: 'M.Phil in Clinical Psychology', institution: 'NIMHANS', year: '2021' }
  ]);
  const [consultModes, setConsultModes] = useState(['chat', 'voice', 'video']);
  const [consultationFee, setConsultationFee] = useState(1200);
  const [bio, setBio] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Email OTP Verification state
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpNotice, setOtpNotice] = useState({ type: '', text: '' });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success modals
  const [memberSuccess, setMemberSuccess] = useState(null); // { publicId, recoveryPhrase }
  const [therapistSuccess, setTherapistSuccess] = useState(null); // { therapistId }
  const [copiedId, setCopiedId] = useState(false);

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setOtpNotice({ type: 'error', text: 'Please enter a valid email address first.' });
      return;
    }
    setOtpSending(true);
    setOtpNotice({ type: '', text: '' });
    const res = await Api.sendRegistrationOtp(email);
    setOtpSending(false);
    if (res.success) {
      setOtpSent(true);
      setOtpNotice({ type: 'success', text: `Verification code sent to ${email}!` });
    } else {
      setOtpNotice({ type: 'error', text: res.message || 'Failed to send verification code.' });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 6) {
      setOtpNotice({ type: 'error', text: 'Please enter the 6-digit verification code.' });
      return;
    }
    setOtpVerifying(true);
    setOtpNotice({ type: '', text: '' });
    const res = await Api.verifyRegistrationOtp(email, otpCode);
    setOtpVerifying(false);
    if (res.success) {
      setEmailVerified(true);
      setOtpNotice({ type: 'success', text: 'Email verified successfully! You can now proceed.' });
    } else {
      setOtpNotice({ type: 'error', text: res.message || 'Invalid or expired OTP code.' });
    }
  };

  useEffect(() => {
    if (user && !memberSuccess && !therapistSuccess) {
      if (user.role === 'therapist') navigate('/therapist', { replace: true });
      else if (user.role === 'admin' || user.role === 'super_admin') navigate('/admin', { replace: true });
      else navigate('/welcome', { replace: true });
    }
  }, [user, memberSuccess, therapistSuccess, navigate]);

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

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 20 || parsedAge > 25) {
      setError('MindCare Sanctuary is designed specifically for ages 20–25. Please enter an age between 20 and 25.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both entries.');
      return;
    }

    if (!emailVerified) {
      setError('Please click "Get OTP" and verify your email address with the 6-digit code before proceeding.');
      return;
    }

    if (!agree) {
      setError('Please acknowledge the client privacy notice to proceed.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({
        name,
        email,
        password,
        age: parsedAge,
        gender,
        city,
        state,
        role: 'client'
      });

      if (res.success) {
        setMemberSuccess({
          publicId: res.user?.public_id || 'MC-WELCOME',
          recoveryPhrase: res.recoveryPhrase || 'sanctuary-growth-breeze'
        });
      } else {
        setError(res.message || 'Registration failed.');
        setSubmitting(false);
      }
    } catch (err) {
      setError('An unexpected error occurred during account creation.');
      setSubmitting(false);
    }
  };

  const handleTherapistSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both entries.');
      return;
    }

    if (!emailVerified) {
      setError('Please click "Get OTP" and verify your official email address before submitting credentials.');
      return;
    }

    if (!licenseNumber.trim() || !licensingBoard.trim()) {
      setError('Clinical license number and licensing board are required.');
      return;
    }

    if (!termsAccepted) {
      setError('You must confirm that your credentials are authentic and accept the terms.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await Api.registerTherapist({
        name,
        email,
        password,
        title: therapistTitle,
        license_number: licenseNumber,
        licensing_board: licensingBoard,
        specialties: selectedSpecialties,
        skills_practised: selectedSkills,
        education_entries: degrees,
        years_of_experience: yearsOfExperience,
        consultation_modes: consultModes,
        consultation_fee: consultationFee,
        bio,
        city,
        state,
        gender,
        therapist_type: therapistType,
        mobile_number: mobileNumber,
        terms_accepted: termsAccepted
      });

      if (res.success) {
        setTherapistSuccess({
          therapistId: res.therapistId
        });
      } else {
        setError(res.message || 'Therapist registration failed.');
        setSubmitting(false);
      }
    } catch (err) {
      setError('An error occurred during therapist registration.');
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  return (
    <div className="auth-page" style={{ padding: '40px 20px 80px', minHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '580px', width: '100%', padding: '40px 32px', borderRadius: '24px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>
            {activePortal === 'therapist' ? '' : ''}
          </div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
            {activePortal === 'therapist' ? 'Join the Clinical Care Team' : 'Create Your Sanctuary Space'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {activePortal === 'therapist'
              ? 'Register with your clinical credentials to consult with sanctuary members.'
              : 'Begin your personal wellness journey. Confidential, calm, and ad-free.'}
          </p>
        </div>

        {/* Portal Tabs: Member vs Therapist */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          padding: '4px',
          background: 'var(--bg-surface-elevated, rgba(0,0,0,0.03))',
          borderRadius: '14px',
          marginBottom: '26px'
        }}>
          <button
            type="button"
            onClick={() => { setActivePortal('member'); setError(''); }}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              background: activePortal === 'member' ? '#52b788' : 'transparent',
              color: activePortal === 'member' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
             User (Ages 20–25)
          </button>
          <button
            type="button"
            onClick={() => { setActivePortal('therapist'); setError(''); }}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              background: activePortal === 'therapist' ? '#2b5f7d' : 'transparent',
              color: activePortal === 'therapist' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
             Therapist
          </button>
        </div>

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

        {/* ── MEMBER REGISTRATION FORM ── */}
        {activePortal === 'member' && !memberSuccess && (
          <form onSubmit={handleMemberSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Full Name or Preferred Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Alex Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Email Address *
                </label>
                {emailVerified && (
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2d6a4f' }}>
                     Verified
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  className="input-field"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailVerified(false);
                    setOtpSent(false);
                    setOtpNotice({ type: '', text: '' });
                  }}
                  disabled={emailVerified}
                  required
                />
                {!emailVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending || !email || !email.includes('@')}
                    className="btn-secondary"
                    style={{ whiteSpace: 'nowrap', padding: '0 16px', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    {otpSending ? 'Sending...' : otpSent ? 'Resend OTP' : 'Get OTP'}
                  </button>
                )}
              </div>

              {otpSent && !emailVerified && (
                <div style={{
                  marginTop: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(82, 183, 136, 0.08)',
                  border: '1px solid rgba(82, 183, 136, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Enter the 6-digit verification code sent to <strong>{email}</strong>:
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="123456"
                      className="input-field"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      style={{ width: '130px', textAlign: 'center', letterSpacing: '3px', fontWeight: 700 }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpVerifying || otpCode.length < 6}
                      className="btn-primary"
                      style={{ padding: '0 18px', fontSize: '0.8rem' }}
                    >
                      {otpVerifying ? 'Verifying...' : 'Verify OTP →'}
                    </button>
                  </div>
                </div>
              )}

              {otpNotice.text && (
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  marginTop: '6px',
                  color: otpNotice.type === 'success' ? '#2d6a4f' : '#dc2626'
                }}>
                  {otpNotice.text}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Age <span style={{ fontSize: '0.74rem', color: '#52b788' }}>(20–25 prototype)</span>
                </label>
                <input
                  type="number"
                  min="20"
                  max="25"
                  className="input-field"
                  placeholder="20 - 25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Gender
                </label>
                <select
                  className="input-field"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{ background: 'var(--bg-surface)' }}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  City
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Pune"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  State
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password (min 6 characters)
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Choose a safe password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {password && (
              <div style={{ fontSize: '0.78rem', color: strength.color }}>
                Security: {strength.label}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
              <input
                type="checkbox"
                id="showPass"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <label htmlFor="showPass" style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>Show password</label>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="agree"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                style={{ marginTop: '3px' }}
              />
              <label htmlFor="agree" style={{ color: 'var(--text-secondary)', lineHeight: 1.4, cursor: 'pointer' }}>
                I agree to the MindCare Sanctuary confidentiality terms. Client data is protected with end-to-end field encryption.
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ width: '100%', padding: '14px', marginTop: '10px', background: '#52b788', borderColor: '#52b788' }}
            >
              {submitting ? 'Creating Sanctuary Space...' : 'Register as Sanctuary Member →'}
            </button>
          </form>
        )}

        {/* ── THERAPIST REGISTRATION FORM ── */}
        {activePortal === 'therapist' && !therapistSuccess && (
          <form onSubmit={handleTherapistSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Clinician Full Name & Qualifications
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Dr. Jane Doe, PsyD"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Professional Type
                </label>
                <select
                  className="input-field"
                  value={therapistType}
                  onChange={(e) => setTherapistType(e.target.value)}
                >
                  {CLINICAL_CONFIG.therapistTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Professional Title
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Licensed Clinical Psychologist"
                  value={therapistTitle}
                  onChange={(e) => setTherapistTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Official Email *
                  </label>
                  {emailVerified && (
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2d6a4f' }}>
                       Verified
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="dr.clinician@clinic.org"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailVerified(false);
                      setOtpSent(false);
                      setOtpNotice({ type: '', text: '' });
                    }}
                    disabled={emailVerified}
                    required
                  />
                  {!emailVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending || !email || !email.includes('@')}
                      className="btn-secondary"
                      style={{ whiteSpace: 'nowrap', padding: '0 12px', fontSize: '0.78rem', fontWeight: 600 }}
                    >
                      {otpSending ? '...' : otpSent ? 'Resend' : 'Get OTP'}
                    </button>
                  )}
                </div>

                {otpSent && !emailVerified && (
                  <div style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(82, 183, 136, 0.08)',
                    border: '1px solid rgba(82, 183, 136, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      6-digit OTP code sent to <strong>{email}</strong>:
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        maxLength="6"
                        placeholder="123456"
                        className="input-field"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        style={{ width: '110px', textAlign: 'center', letterSpacing: '2px', fontWeight: 700 }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpVerifying || otpCode.length < 6}
                        className="btn-primary"
                        style={{ padding: '0 14px', fontSize: '0.76rem' }}
                      >
                        {otpVerifying ? 'Verifying...' : 'Verify →'}
                      </button>
                    </div>
                  </div>
                )}

                {otpNotice.text && (
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginTop: '4px',
                    color: otpNotice.type === 'success' ? '#2d6a4f' : '#dc2626'
                  }}>
                    {otpNotice.text}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Mobile Number (E.164)
                </label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+91 98XXXXXXXX"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Clinical License Number
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. RCI-CR-28491"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Licensing Board / Council
                </label>
                <select
                  className="input-field"
                  value={licensingBoard}
                  onChange={(e) => setLicensingBoard(e.target.value)}
                  required
                >
                  {CLINICAL_CONFIG.licensingBodies.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Mental Health Specializations
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {CLINICAL_CONFIG.specializations.map(spec => {
                  const isSelected = selectedSpecialties.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => {
                        setSelectedSpecialties(prev =>
                          isSelected ? prev.filter(s => s !== spec) : [...prev, spec]
                        );
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '100px',
                        border: isSelected ? '1px solid var(--primary, #2d6a4f)' : '1px solid rgba(0,0,0,0.1)',
                        backgroundColor: isSelected ? 'rgba(82, 183, 136, 0.15)' : '#ffffff',
                        color: isSelected ? 'var(--primary-dark, #1b4332)' : 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isSelected ? ' ' : '+ '}{spec}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Therapies / Modalities Practiced
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {CLINICAL_CONFIG.skillsTherapies.map(skill => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        setSelectedSkills(prev =>
                          isSelected ? prev.filter(s => s !== skill) : [...prev, skill]
                        );
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '100px',
                        border: isSelected ? '1px solid #7c3aed' : '1px solid rgba(0,0,0,0.1)',
                        backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.1)' : '#ffffff',
                        color: isSelected ? '#7c3aed' : 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isSelected ? ' ' : '+ '}{skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Practice Bio & Approach
              </label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="Brief summary of your clinical approach and therapeutic orientation..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  City
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. New Delhi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  State
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Delhi"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  className="input-field"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Consultation Fee (₹ optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  className="input-field"
                  placeholder="1200"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              backgroundColor: 'rgba(240, 246, 242, 0.7)',
              borderRadius: '12px',
              border: '1px solid rgba(82, 183, 136, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <input
                type="checkbox"
                id="therapistTerms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ marginTop: '3px' }}
                required
              />
              <label htmlFor="therapistTerms" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {CLINICAL_CONFIG.consentNotice}
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
              <input
                type="checkbox"
                id="showTherapistPass"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <label htmlFor="showTherapistPass" style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>Show password</label>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ width: '100%', padding: '14px', marginTop: '10px', background: '#2b5f7d', borderColor: '#2b5f7d' }}
            >
              {submitting ? 'Registering Practitioner...' : 'Register as Clinical Practitioner →'}
            </button>
          </form>
        )}

        {/* ── MEMBER SUCCESS MODAL ── */}
        {memberSuccess && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '14px' }}></div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Welcome to MindCare Sanctuary!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Your account has been created successfully. Please take note of your permanent Sanctuary User ID:
            </p>

            <div style={{
              background: 'var(--bg-surface-elevated, #f4fbf7)',
              border: '2px dashed #52b788',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                Your Permanent Sanctuary User ID
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2d6a4f', letterSpacing: '2px', margin: '8px 0' }}>
                {memberSuccess.publicId}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                You can log in anytime using this User ID or your email address.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => copyToClipboard(memberSuccess.publicId)}
                style={{ padding: '12px 20px' }}
              >
                {copiedId ? ' Copied ID' : ' Copy User ID'}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/welcome', { replace: true })}
                style={{ padding: '12px 28px', background: '#52b788', borderColor: '#52b788' }}
              >
                Begin Questionnaire & Welcome →
              </button>
            </div>
          </div>
        )}

        {/* ── THERAPIST SUCCESS MODAL ── */}
        {therapistSuccess && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '14px' }}></div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Practitioner Account Created!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Your clinical profile has been created and is now queued for administrative verification. Please record your official Therapist ID:
            </p>

            <div style={{
              background: 'var(--bg-surface-elevated, #f0f7fa)',
              border: '2px dashed #2b5f7d',
              borderRadius: '16px',
              padding: '22px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                Your Official Therapist ID
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2b5f7d', letterSpacing: '3px', margin: '8px 0' }}>
                {therapistSuccess.therapistId}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                 <strong>Important:</strong> You must enter this <strong>Therapist ID</strong> along with your registered email and password whenever you log in.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => copyToClipboard(therapistSuccess.therapistId)}
                style={{ padding: '12px 20px' }}
              >
                {copiedId ? ' Copied ID' : ' Copy Therapist ID'}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/login?portal=therapist', { replace: true })}
                style={{ padding: '12px 28px', background: '#2b5f7d', borderColor: '#2b5f7d' }}
              >
                Proceed to Therapist Login →
              </button>
            </div>
          </div>
        )}

        {/* ── BOTTOM SWITCH / LOGIN BANNER ── */}
        {!memberSuccess && !therapistSuccess && (
          <div style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-glass, rgba(0,0,0,0.06))',
            textAlign: 'center',
            fontSize: '0.88rem'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Already have a MindCare account? </span>
            <Link
              to={`/login?portal=${activePortal}`}
              style={{ fontWeight: 700, color: activePortal === 'therapist' ? '#2b5f7d' : '#52b788', textDecoration: 'none' }}
            >
              Log in here →
            </Link>

            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              System Governance? <Link to="/login?portal=admin" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Admin Login Console</Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
