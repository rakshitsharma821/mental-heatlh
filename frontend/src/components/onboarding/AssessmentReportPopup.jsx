import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AssessmentReportPopup
 * 
 * Clinical Assessment Summary Modal
 * Shows:
 * 1. Clean, grounded modal entrance (zero 3D slope / perspective tilt)
 * 2. Visual score breakdown & emotional landscape analysis
 * 3. Matched Clinician Specialization recommendation based on score band
 * 4. Step-by-step Therapist booking walkthrough & 1-click booking
 * 5. Empathetic Care Companion launcher
 */
export default function AssessmentReportPopup({
  isOpen,
  onClose,
  totalScore = 10,
  band,
  aiAnalysis,
  onOpenCompanion,
  onOpenBooking
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'stream' | 'booking' | 'companion'

  if (!isOpen) return null;

  const scorePercentage = Math.min(100, Math.round((totalScore / 24) * 100));
  const themeColor = band?.themeColor || '#357255';
  
  const therapistRec = aiAnalysis?.recommendedTherapy ? {
    category: aiAnalysis.recommendedSpecialist || band?.recommendedTherapist?.category || 'Licensed Clinical Psychologist',
    subtitle: aiAnalysis.recommendedTherapy,
    focusAreas: aiAnalysis.focusAreas || band?.recommendedTherapist?.focusAreas || ['Emotional balance', 'Stress regulation'],
    modality: aiAnalysis.recommendedTherapy,
    cadence: aiAnalysis.sessionFrequency || band?.recommendedTherapist?.cadence || 'Weekly structured sessions',
    rationale: aiAnalysis.rationale || band?.recommendedTherapist?.rationale || 'Tailored to your assessment profile.',
    clinicalSummary: aiAnalysis.clinicalSummary || band?.summary
  } : (band?.recommendedTherapist || {
    category: 'Licensed Clinical Psychologist',
    subtitle: 'Recommended based on your current assessment score',
    focusAreas: ['Emotional balance', 'Stress regulation', 'Personal guidance'],
    modality: 'Evidence-Based Cognitive & Mindful Practices',
    cadence: 'Structured weekly sessions',
    rationale: 'Connecting with a matched practitioner provides individualized support tailored to your emotional profile.'
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(15, 30, 22, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'backdropFadeIn 0.25s ease-out'
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes modalEnterFade {
          from {
            opacity: 0;
            transform: scale(0.97) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .report-tab-btn {
          padding: 9px 18px;
          border-radius: 10px;
          border: 1px solid transparent;
          background: transparent;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-secondary);
        }
        .report-tab-btn.active {
          background: #ffffff;
          color: var(--primary-dark);
          border-color: rgba(0, 0, 0, 0.08);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .clinical-rec-card {
          border: 1.5px solid ${themeColor}44;
          background: linear-gradient(180deg, #ffffff 0%, ${themeColor}08 100%);
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 22px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }
      `}</style>

      {/* Main Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.22)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          animation: 'modalEnterFade 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Header Ribbon */}
        <div
          style={{
            background: `linear-gradient(135deg, ${themeColor}12 0%, #ffffff 85%)`,
            padding: '24px 28px 18px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            position: 'relative'
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Report"
            style={{
              position: 'absolute',
              top: '18px',
              right: '20px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              background: '#ffffff',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'background 0.2s',
              zIndex: 10
            }}
          >
            
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* Score Badge */}
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '16px',
                background: themeColor,
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 20px ${themeColor}44`,
                flexShrink: 0
              }}
            >
              <span style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{totalScore}</span>
              <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9 }}>of 24</span>
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    backgroundColor: `${themeColor}20`,
                    color: themeColor,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '100px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Clinical Report
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Classification: <strong>{band?.title}</strong>
                </span>
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {band?.title} — Personal Reflection Report
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Evidence-informed analysis with specialist matching tailored to your assessment score.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              marginTop: '16px',
              padding: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              borderRadius: '12px',
              overflowX: 'auto'
            }}
          >
            <button
              type="button"
              className={`report-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Report Breakdown
            </button>
            <button
              type="button"
              className={`report-tab-btn ${activeTab === 'stream' ? 'active' : ''}`}
              onClick={() => setActiveTab('stream')}
            >
              Mindful Practices
            </button>
            <button
              type="button"
              className={`report-tab-btn ${activeTab === 'booking' ? 'active' : ''}`}
              onClick={() => setActiveTab('booking')}
            >
              Recommended Specialist
            </button>
            <button
              type="button"
              className={`report-tab-btn ${activeTab === 'companion' ? 'active' : ''}`}
              onClick={() => setActiveTab('companion')}
            >
              Care Companion
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div
          style={{
            padding: '24px 28px',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: '#f8faf9'
          }}
        >
          {/* TAB 1: OVERVIEW & THERAPIST RECOMMENDATION */}
          {activeTab === 'overview' && (
            <div>
              {/* Score Meter Gauge */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '20px',
                  borderRadius: '16px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                  marginBottom: '20px',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Emotional Balance Spectrum
                  </span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: themeColor }}>
                    {totalScore} / 24 ({scorePercentage}%)
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div
                  style={{
                    height: '10px',
                    width: '100%',
                    backgroundColor: '#e9ecef',
                    borderRadius: '100px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${scorePercentage}%`,
                      backgroundColor: themeColor,
                      borderRadius: '100px',
                      transition: 'width 0.8s ease'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  <span>Steady Rhythm (0–7)</span>
                  <span>Rest & Reset (8–15)</span>
                  <span>Care & Comfort (16–24)</span>
                </div>
              </div>

              {/* RECOMMENDED SPECIALIST CARD */}
              <div className="clinical-rec-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      backgroundColor: `${themeColor}20`,
                      color: themeColor,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      Matched Clinician Specialization
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px', marginBottom: '2px' }}>
                      {therapistRec.category}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {therapistRec.subtitle}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenBooking) onOpenBooking();
                    }}
                    className="btn-primary"
                    style={{
                      padding: '9px 18px',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      backgroundColor: themeColor,
                      borderColor: themeColor
                    }}
                  >
                    Consult with This Specialist →
                  </button>
                </div>

                <div style={{
                  padding: '14px 16px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  marginBottom: '14px'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Clinical Rationale
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.55' }}>
                    {therapistRec.rationale}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recommended Modalities</div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '3px' }}>
                      {therapistRec.modality}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Suggested Frequency</div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '3px' }}>
                      {therapistRec.cadence}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Narrative */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '20px',
                  borderRadius: '16px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  marginBottom: '16px'
                }}
              >
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Assessment Interpretation
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                  {band?.summary || "Your responses indicate your nervous system is navigating active demands. With intentional breathing, gentle focus shifts, and proper resting periods, your mental clarity is naturally restored."}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: MINDFUL PRACTICES */}
          {activeTab === 'stream' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                  Recommended Practices Matched to Your Score
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Evidence-based decompression tools to settle autonomic arousal.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase' }}>Therapeutic Practice</span>
                    <h4 style={{ margin: '3px 0 4px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Interactive Games & Thought Defusion
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Kinetic tactile exercises and cognitive defusion to break rumination loops.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/games');
                    }}
                    className="btn-primary"
                    style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem' }}
                  >
                    Open Games Space →
                  </button>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase' }}>Autonomic Regulation</span>
                    <h4 style={{ margin: '3px 0 4px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Resonance Breathing Exercise
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Rhythmic pacing that stimulates vagal nerve tone and slows rapid pulse.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/breathing');
                    }}
                    className="btn-primary"
                    style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem' }}
                  >
                    Start Breathing Session →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RECOMMENDED SPECIALIST DETAILS */}
          {activeTab === 'booking' && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                  Professional Consultation Guidance
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Based on your score band ({band?.title}), we match you with the following clinical specialization:
                </p>
              </div>

              <div className="clinical-rec-card" style={{ marginBottom: '20px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  backgroundColor: `${themeColor}20`,
                  color: themeColor,
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  Primary Match
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px', marginBottom: '4px' }}>
                  {therapistRec.category}
                </h3>
                <p style={{ margin: '0 0 14px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  {therapistRec.subtitle}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Core Clinical Focus:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(therapistRec.focusAreas || []).map((area, idx) => (
                      <span key={idx} style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        fontSize: '0.78rem',
                        color: 'var(--text-primary)'
                      }}>
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{
                  padding: '14px 16px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>
                    Why this clinician is recommended for you
                  </div>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {therapistRec.rationale}
                  </p>
                </div>
              </div>

              {/* Booking Process Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '14px 18px', borderRadius: '12px', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '3px' }}>
                    Step 1: Select Your Slot & Focus Area
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Specify what you would like to address (stress, emotional fatigue, or transitions) and pick a convenient time.
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '14px 18px', borderRadius: '12px', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '3px' }}>
                    Step 2: Private, Confidential Consultation
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Connect directly in an encrypted live consultation room. Your session notes remain strictly between you and your clinician.
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenBooking) onOpenBooking();
                  }}
                  className="btn-primary"
                  style={{
                    padding: '12px 28px',
                    borderRadius: '12px',
                    fontSize: '0.92rem',
                    fontWeight: 700
                  }}
                >
                  Book Session with Matched Specialist →
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CARE COMPANION */}
          {activeTab === 'companion' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                  MindCare Care Companion (Aria)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  A safe, private sounding board for gentle reflection and stress decompression.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.88rem'
                    }}
                  >
                    MC
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', color: 'var(--text-primary)' }}>Aria Care Companion</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--primary-dark)', fontWeight: 600 }}>Available 24/7</span>
                  </div>
                </div>

                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                  <li><strong>Non-Judgmental Listening:</strong> Express thoughts freely in English, Hindi, or mixed language.</li>
                  <li><strong>Gentle Grounding:</strong> Practical techniques to slow down when mental racing feels intense.</li>
                  <li><strong>Complementary Care:</strong> Aria does not provide clinical diagnosis; she offers supportive, grounding accompaniment.</li>
                </ul>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenCompanion) onOpenCompanion();
                  }}
                  className="btn-primary"
                  style={{
                    padding: '12px 26px',
                    borderRadius: '12px',
                    fontSize: '0.92rem',
                    fontWeight: 700
                  }}
                >
                  Start Conversation with Aria →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
