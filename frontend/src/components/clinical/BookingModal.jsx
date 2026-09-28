import React, { useState } from 'react';
import { ClinicalConsentService } from '../../services/clinicalConsent';
import { useAuth } from '../../context/AuthContext';

export default function BookingModal({ isOpen, onClose, initialReason = '' }) {
  const { user } = useAuth();
  const therapist = ClinicalConsentService.getDefaultTherapist();

  const [sessionType, setSessionType] = useState('Virtual Video Consultation (45 min)');
  const [preferredWindow, setPreferredWindow] = useState('Next Available');
  const [clientNote, setClientNote] = useState(initialReason);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    ClinicalConsentService.submitSessionRequest({
      clientName: user?.name || 'Sanctuary Member',
      clientEmail: user?.email || '',
      sessionType,
      preferredWindow,
      clientNote: clientNote.trim()
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(26, 46, 34, 0.45)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '36px',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(33, 64, 47, 0.16)',
        border: '1px solid var(--border-hover)',
        animation: 'slideUpFade 0.3s ease-out'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="icon-btn-ghost"
          style={{ position: 'absolute', top: '20px', right: '20px' }}
        >
          ✕
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🌿</div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Session Request Submitted
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              {therapist.name}'s clinic has received your request. You will receive a confidential confirmation via {user?.email || 'email'}.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'var(--primary)'
              }}>
                Clinical Bridge
              </span>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '2px', marginBottom: '4px' }}>
                Connect with a Professional
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Request a dedicated, confidential session with {therapist.name} ({therapist.license}).
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Session Format</label>
                <select
                  className="input-field"
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                >
                  <option value="Virtual Video Consultation (45 min)">Virtual Video Consultation (45 min)</option>
                  <option value="In-Person Sanctuary Consultation">In-Person Consultation (Office)</option>
                  <option value="Asynchronous Clinical Check-in Note">Asynchronous Clinical Check-in</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Preferred Time Window</label>
                <select
                  className="input-field"
                  value={preferredWindow}
                  onChange={(e) => setPreferredWindow(e.target.value)}
                >
                  <option value="Next Available">Urgent / Next Available (Priority)</option>
                  <option value="Morning (9:00 AM – 12:00 PM)">Morning (9:00 AM – 12:00 PM)</option>
                  <option value="Afternoon (1:00 PM – 5:00 PM)">Afternoon (1:00 PM – 5:00 PM)</option>
                  <option value="Evening (5:00 PM – 7:30 PM)">Evening (5:00 PM – 7:30 PM)</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">What would feel most helpful to focus on? (Optional)</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="e.g. Managing workplace anxiety, sleep disruption, or discussing my recent early-warning flags"
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                />
              </div>

              <div style={{
                background: 'rgba(82, 183, 136, 0.1)',
                border: '1px solid rgba(82, 183, 136, 0.25)',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '20px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)'
              }}>
                🔒 <strong>Privacy Assurance:</strong> This request only shares what you explicitly consent to in Settings. If you need urgent immediate help, please call <strong>988</strong>.
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px 24px' }}>
                  Send Session Request →
                </button>
                <button type="button" onClick={onClose} className="btn-ghost" style={{ padding: '12px 20px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
