// ============================================
// MindCare Sanctuary — Personalized Recommendations Page
// Part 2: Score band -> recommended mix of practices and matched clinical guidance
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Storage } from '../services/storage';
import { getBandForScore } from '../config/questionnaire';
import { API_BASE_URL } from '../config/appConfig';
import BookingModal from '../components/clinical/BookingModal';
import TiltCard from '../components/common/TiltCard';
import AssessmentReportPopup from '../components/onboarding/AssessmentReportPopup';

export default function Recommendations() {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(() => Storage.get('mindcare_assessment_result', null));
  const [activeAudio, setActiveAudio] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isReportPopupOpen, setIsReportPopupOpen] = useState(false);

  // Fallback to fetch latest assessment from backend if not in local storage
  useEffect(() => {
    if (!assessment) {
      const token = Storage.get('mindcare_auth_token') || localStorage.getItem('mindcare_auth_token');
      if (token) {
        fetch(`${API_BASE_URL}/assessment/latest`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.assessment) {
              const latest = {
                totalScore: data.assessment.total_score,
                band: data.assessment.band,
                completedAt: data.assessment.completed_at,
                ai_analysis: data.assessment.ai_analysis
              };
              setAssessment(latest);
              Storage.set('mindcare_assessment_result', latest);
            }
          })
          .catch(() => {});
      }
    }
  }, [assessment]);

  const totalScore = assessment ? assessment.totalScore : 10;
  const band = getBandForScore(totalScore);
  const therapistRec = assessment?.ai_analysis?.recommendedTherapy ? {
    category: assessment.ai_analysis.recommendedSpecialist || band.recommendedTherapist.category,
    subtitle: assessment.ai_analysis.recommendedTherapy,
    focusAreas: assessment.ai_analysis.focusAreas || band.recommendedTherapist.focusAreas,
    modality: assessment.ai_analysis.recommendedTherapy,
    cadence: assessment.ai_analysis.sessionFrequency || band.recommendedTherapist.cadence,
    rationale: assessment.ai_analysis.rationale || band.recommendedTherapist.rationale,
    clinicalSummary: assessment.ai_analysis.clinicalSummary || band.summary
  } : band?.recommendedTherapist;

  const handleOpenCompanion = () => {
    window.dispatchEvent(new CustomEvent('open-companion-drawer'));
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px 24px 80px',
      backgroundColor: 'var(--bg-main, #f8fbf9)',
      position: 'relative'
    }}>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        {/* Header Banner */}
        <div className="glass-card" style={{
          padding: '40px 32px',
          borderRadius: '24px',
          marginBottom: '32px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          border: `2px solid ${band.themeColor}33`
        }}>
          <span style={{
            display: 'inline-block',
            padding: '6px 18px',
            borderRadius: '100px',
            backgroundColor: `${band.themeColor}20`,
            color: band.themeColor,
            fontSize: '0.84rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: '14px'
          }}>
            {band.title} · SCORE {totalScore} OF 24
          </span>

          <h1 style={{ fontSize: 'clamp(1.7rem, 3.8vw, 2.3rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
            {band.title}
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: '1.6', maxWidth: '680px', margin: '0 auto 16px' }}>
            {band.summary}
          </p>

          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            lineHeight: '1.5',
            marginTop: '8px',
            marginBottom: '26px'
          }}>
            MindCare assessment results provide reflective self-awareness to help guide your daily wellness routines and clinical consultations.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsReportPopupOpen(true)}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                backgroundColor: band.themeColor,
                borderColor: band.themeColor
              }}
            >
              Open Full Assessment Report
            </button>
            <Link
              to="/dashboard"
              className="btn-ghost"
              style={{ padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600 }}
            >
              Enter My Dashboard
            </Link>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate('/questionnaire')}
              style={{ padding: '12px 22px', borderRadius: '12px', fontWeight: 600 }}
            >
              Retake Assessment
            </button>
          </div>
        </div>

        {/* PROMINENT CLINICIAN SUGGESTION CARD */}
        {therapistRec && (
          <div className="glass-card" style={{
            padding: '32px',
            borderRadius: '24px',
            marginBottom: '36px',
            backgroundColor: '#ffffff',
            border: `2px solid ${band.themeColor}44`,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  backgroundColor: `${band.themeColor}18`,
                  color: band.themeColor,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '8px'
                }}>
                  Clinician Specialization Matched to Your Profile
                </span>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {therapistRec.category}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px', marginBottom: 0 }}>
                  {therapistRec.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="btn-primary"
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  backgroundColor: band.themeColor,
                  borderColor: band.themeColor
                }}
              >
                Consult with This Specialist →
              </button>
            </div>

            <div style={{
              padding: '16px 20px',
              backgroundColor: '#f8faf9',
              borderRadius: '14px',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Why This Clinician Is Recommended
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                {therapistRec.rationale}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '14px 18px', backgroundColor: '#f8faf9', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Recommended Modalities
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {therapistRec.modality}
                </div>
              </div>

              <div style={{ padding: '14px 18px', backgroundColor: '#f8faf9', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Session Cadence
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {therapistRec.cadence}
                </div>
              </div>

              <div style={{ padding: '14px 18px', backgroundColor: '#f8faf9', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Target Focus Areas
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {(therapistRec.focusAreas || []).map((fa, i) => (
                    <span key={i} style={{ fontSize: '0.76rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', color: 'var(--text-secondary)' }}>
                      {fa}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audio Player Banner if Active */}
        {activeAudio && (
          <div style={{
            backgroundColor: 'var(--accent-forest, #2d6a4f)',
            color: '#ffffff',
            padding: '16px 24px',
            borderRadius: '16px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(45, 106, 79, 0.25)'
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.94rem' }}>{activeAudio}</div>
              <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Calming atmosphere active. Breathe softly and take your time.</div>
            </div>
            <button
              type="button"
              onClick={() => setActiveAudio(null)}
              style={{
                background: 'rgba(255,255,255,0.22)',
                border: 'none',
                color: '#fff',
                padding: '7px 16px',
                borderRadius: '100px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              Pause
            </button>
          </div>
        )}

        {/* Recommended Practices Grid */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Tailored Supportive Practices
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Evidence-based practices selected to match your current baseline.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '22px', marginBottom: '44px' }}>
          {/* Breathing Exercises */}
          {band.recommendations.breathing.map((b, idx) => (
            <TiltCard key={`b-${idx}`}>
              <div className="glass-card" style={{
                padding: '26px',
                borderRadius: '20px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                border: '1.5px solid rgba(82, 183, 136, 0.25)'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-dark)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Breathing Exercise
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px', marginBottom: '8px' }}>
                    {b.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.55' }}>
                    {b.desc}
                  </p>
                </div>
                <Link
                  to={b.route}
                  className="btn-primary"
                  style={{ marginTop: '20px', textAlign: 'center', textDecoration: 'none', padding: '11px', borderRadius: '12px', fontWeight: 600 }}
                >
                  Start Breathwork →
                </Link>
              </div>
            </TiltCard>
          ))}

          {/* Calming Games */}
          {band.recommendations.games.map((g, idx) => (
            <TiltCard key={`g-${idx}`}>
              <div className="glass-card" style={{
                padding: '26px',
                borderRadius: '20px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                border: '1.5px solid rgba(107, 163, 199, 0.3)'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-sky-dark, #3e7699)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Sensory Practice
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px', marginBottom: '8px' }}>
                    {g.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.55' }}>
                    {g.desc}
                  </p>
                </div>
                <Link
                  to={g.route}
                  className="btn-secondary"
                  style={{ marginTop: '20px', textAlign: 'center', textDecoration: 'none', padding: '11px', borderRadius: '12px', fontWeight: 600 }}
                >
                  Play Sensory Game →
                </Link>
              </div>
            </TiltCard>
          ))}

          {/* Calming Music */}
          {band.recommendations.music.map((m, idx) => (
            <TiltCard key={`m-${idx}`}>
              <div className="glass-card" style={{
                padding: '26px',
                borderRadius: '20px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                border: '1.5px solid rgba(233, 154, 128, 0.3)'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-peach-dark, #c26d52)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Acoustic Atmosphere
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px', marginBottom: '8px' }}>
                    {m.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.55' }}>
                    {m.desc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAudio(m.title)}
                  className="btn-ghost"
                  style={{ marginTop: '20px', padding: '11px', borderRadius: '12px', fontWeight: 600 }}
                >
                  {activeAudio === m.title ? 'Playing Audio' : 'Listen Now'}
                </button>
              </div>
            </TiltCard>
          ))}
        </div>

        {/* Escalation Callout */}
        <div className="glass-card" style={{
          padding: '36px 32px',
          borderRadius: '24px',
          backgroundColor: '#ffffff',
          border: '1.5px solid rgba(82, 183, 136, 0.3)',
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Do you feel you need deeper support?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: '1.6', maxWidth: '640px', margin: '0 auto 24px' }}>
            MindCare recommendations are supportive wellness practices, not medical treatments. If you would like confidential support, choose how you would like to proceed:
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleOpenCompanion}
              className="btn-primary"
              style={{ padding: '13px 26px', borderRadius: '12px', fontSize: '0.92rem', fontWeight: 600 }}
            >
              Talk to Aria Companion
            </button>

            <button
              type="button"
              onClick={() => setIsBookingOpen(true)}
              className="btn-ghost"
              style={{
                padding: '13px 26px',
                borderRadius: '12px',
                fontSize: '0.92rem',
                fontWeight: 600,
                borderColor: 'var(--primary)',
                color: 'var(--primary-dark)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)'
              }}
            >
              Connect with a Clinical Specialist
            </button>
          </div>

          <div style={{ marginTop: '18px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Professional sessions and clinical treatment plans are evaluated and led exclusively by licensed practitioners.
          </div>
        </div>

        {/* Assessment Report Modal */}
        <AssessmentReportPopup
          isOpen={isReportPopupOpen}
          onClose={() => setIsReportPopupOpen(false)}
          totalScore={totalScore}
          band={band}
          aiAnalysis={assessment?.ai_analysis}
          onOpenCompanion={handleOpenCompanion}
          onOpenBooking={() => setIsBookingOpen(true)}
        />

        {/* Clinical Booking Modal */}
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      </div>
    </div>
  );
}
