import React, { useState, useEffect } from 'react';
import { Api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UI_STRINGS } from '../../config/strings';

export default function BookingModal({ isOpen, onClose, initialReason = '', onBooked }) {
  const { user } = useAuth();

  const [therapists, setTherapists] = useState([]);
  const [selectedTherapistId, setSelectedTherapistId] = useState('no_preference');
  const [mode, setMode] = useState('video');
  const [slotDuration, setSlotDuration] = useState(45);
  
  // Default to tomorrow 10:00 AM IST
  const getDefaultSlot = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm format for datetime-local
  };

  const [preferredSlot, setPreferredSlot] = useState(getDefaultSlot);
  const [clientNote, setClientNote] = useState(initialReason);
  const [consentShareNote, setConsentShareNote] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSubmitted(false);
      Api.getTherapistDirectory().then(res => {
        if (res.success && res.therapists) {
          setTherapists(res.therapists);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (clientNote.trim() && !consentShareNote) {
      setError('Please check the consent box to share your confidential note with the clinical team.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        preferred_therapist_id: selectedTherapistId === 'no_preference' ? null : selectedTherapistId,
        preferred_slot: new Date(preferredSlot).toISOString(),
        mode,
        slot_duration_minutes: Number(slotDuration),
        client_note: clientNote.trim(),
        consent_share_note: consentShareNote
      };

      const res = await Api.createSessionRequest(payload);
      if (res.success) {
        setSubmitted(true);
        if (onBooked) onBooked(res.booking);
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 2200);
      } else {
        setError(res.message || 'Unable to schedule appointment. Please choose another time or clinician.');
      }
    } catch (err) {
      setError('Server unreachable. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAria = () => {
    onClose();
    const ariaTrigger = document.querySelector('.companion-trigger-btn');
    if (ariaTrigger) ariaTrigger.click();
  };

  const selectedTherapist = therapists.find(t => t.id === selectedTherapistId);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(26, 46, 34, 0.35)',
      backdropFilter: 'blur(var(--blur-md, 14px))',
      WebkitBackdropFilter: 'blur(var(--blur-md, 14px))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        maxWidth: '580px',
        width: '100%',
        padding: '34px',
        position: 'relative',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-hover)',
        animation: 'slideUpFade 0.3s var(--motion-gentle-spring, ease-out)',
        maxHeight: '90vh',
        overflowY: 'auto'
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
          <div style={{ textAlign: 'center', padding: '36px 16px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🌿</div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {UI_STRINGS.clinical.bookingSuccess}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              {UI_STRINGS.clinical.bookingSuccessDetail}
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'var(--primary)'
              }}>
                Clinical Appointments
              </span>
              <h2 style={{ fontSize: '1.45rem', color: 'var(--text-primary)', marginTop: '2px', marginBottom: '4px' }}>
                {UI_STRINGS.clinical.requestTitle}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {UI_STRINGS.clinical.requestSubtitle}
              </p>
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '0.85rem',
                marginBottom: '16px'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* 24/7 AI Companion Aria Banner */}
            <div style={{
              background: 'rgba(82, 183, 136, 0.08)',
              border: '1px solid rgba(82, 183, 136, 0.25)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Need immediate emotional support?
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Aria is available 24/7 for calm, grounded reflection.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAria}
                className="btn-ghost"
                style={{ padding: '6px 14px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
              >
                ✦ Open Aria
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Clinician Selection */}
              <div className="input-group">
                <label className="input-label">Preferred Clinician</label>
                <select
                  className="input-field"
                  value={selectedTherapistId}
                  onChange={(e) => setSelectedTherapistId(e.target.value)}
                >
                  <option value="no_preference">🌱 No Preference (First Available Verified Clinician)</option>
                  {therapists.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.title}) {t.is_available_now ? '• Available Now' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTherapist && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '16px',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      ✓ Verified Clinical Practitioner
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Timezone: {selectedTherapist.timezone || 'Asia/Kolkata'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: '4px 0 2px 0', fontSize: '0.75rem' }}>
                    Specialties: {selectedTherapist.specialties?.join(', ') || 'CBT, Anxiety, Mindfulness'}
                  </p>
                </div>
              )}

              {/* Consultation Mode */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setMode('video')}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '12px',
                    border: `1px solid ${mode === 'video' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: mode === 'video' ? 'rgba(82, 183, 136, 0.15)' : 'var(--bg-glass)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '0.82rem',
                    fontWeight: mode === 'video' ? 600 : 400
                  }}
                >
                  <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>📹</div>
                  Video Call
                </button>
                <button
                  type="button"
                  onClick={() => setMode('voice')}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '12px',
                    border: `1px solid ${mode === 'voice' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: mode === 'voice' ? 'rgba(82, 183, 136, 0.15)' : 'var(--bg-glass)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '0.82rem',
                    fontWeight: mode === 'voice' ? 600 : 400
                  }}
                >
                  <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🎙️</div>
                  Voice Call
                </button>
                <button
                  type="button"
                  onClick={() => setMode('chat')}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '12px',
                    border: `1px solid ${mode === 'chat' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: mode === 'chat' ? 'rgba(82, 183, 136, 0.15)' : 'var(--bg-glass)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '0.82rem',
                    fontWeight: mode === 'chat' ? 600 : 400
                  }}
                >
                  <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>💬</div>
                  Secure Chat
                </button>
              </div>

              {/* Slot Duration & Preferred DateTime */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Duration</label>
                  <select
                    className="input-field"
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(e.target.value)}
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Preferred Date & Time (IST)</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={preferredSlot}
                    onChange={(e) => setPreferredSlot(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Optional Confidential Note */}
              <div className="input-group">
                <label className="input-label">Confidential Note (Optional)</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Share anything you would like your clinician to know beforehand..."
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                />
              </div>

              {/* Explicit Consent Checkbox */}
              {clientNote.trim() && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '18px',
                  background: 'rgba(82, 183, 136, 0.08)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(82, 183, 136, 0.2)'
                }}>
                  <input
                    type="checkbox"
                    id="consent_note_share"
                    checked={consentShareNote}
                    onChange={(e) => setConsentShareNote(e.target.checked)}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <label htmlFor="consent_note_share" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.5 }}>
                    <strong>Explicit Clinical Consent:</strong> I authorize MindCare clinical staff to securely decrypt and review this note exclusively for session preparation.
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px 24px' }}
                >
                  {loading ? 'Submitting Request...' : 'Confirm Session Request →'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-ghost"
                  style={{ padding: '12px 20px' }}
                >
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