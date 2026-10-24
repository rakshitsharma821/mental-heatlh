// ============================================
// MindCare Sanctuary — Personalized Recommendations Page
// Part 2: Score band -> recommended mix of games, meditation,
// breathing exercises, yoga/movement, and calming music.
// At the end: "Do you still feel drained or uneasy?"
// -> Talk to AI companion OR Connect with a psychiatrist/psychologist.
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Storage } from '../services/storage';
import { getBandForScore } from '../config/questionnaire';
import { API_BASE_URL } from '../config/appConfig';
import BookingModal from '../components/clinical/BookingModal';
import TiltCard from '../components/common/TiltCard';

function getFriendlyBadge(bandId) {
  const labels = {
    low: '🌱 Steady & Grounded',
    moderate: '🌤️ Taking Care',
    high: '🤝 Extra Support Available'
  };
  return labels[bandId] || bandId;
}

export default function Recommendations() {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(() => Storage.get('mindcare_assessment_result', null));
  const [activeAudio, setActiveAudio] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

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
                completedAt: data.assessment.completed_at
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

  const handleOpenCompanion = () => {
    // Dispatch custom event to trigger CompanionDrawer
    window.dispatchEvent(new CustomEvent('open-companion-drawer'));
  };

  let cardGlobalIndex = 0;

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
          marginBottom: '36px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          border: `2px solid ${band.themeColor}33`,
          animation: 'slideUpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards'
        }}>
          <span style={{
            display: 'inline-block',
            padding: '6px 18px',
            borderRadius: '100px',
            backgroundColor: `${band.themeColor}22`,
            color: band.themeColor,
            fontSize: '0.84rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: '14px'
          }}>
            {getFriendlyBadge(band.id)} · SCORE {totalScore}/24
          </span>

          <h1 style={{ fontSize: 'clamp(1.7rem, 3.8vw, 2.3rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            {band.title}
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6', maxWidth: '680px', margin: '0 auto 20px' }}>
            {band.summary}
          </p>

          {/* Disclaimer */}
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.84rem',
            lineHeight: '1.5',
            fontStyle: 'italic',
            marginTop: '8px',
            marginBottom: '26px'
          }}>
            🌿 This is a self-reflection tool, not a clinical diagnosis.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/dashboard"
              className="btn-primary"
              style={{ padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600 }}
            >
              Enter My Dashboard ✦
            </Link>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate('/questionnaire')}
              style={{ padding: '12px 22px', borderRadius: '12px', fontWeight: 600 }}
            >
              Retake Assessment ↺
            </button>
          </div>
        </div>

        {/* Audio Player Banner if Active */}
        {activeAudio && (
          <div style={{
            backgroundColor: 'var(--accent-forest, #2d6a4f)',
            color: '#ffffff',
            padding: '16px 24px',
            borderRadius: '18px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(45, 106, 79, 0.25)',
            animation: 'fadeInText 0.4s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '1.5rem' }}>🎵</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.94rem' }}>{activeAudio}</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Calming audio atmosphere active. Breathe softly and take your time.</div>
              </div>
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

        {/* Recommended Mix Grid */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Your Tailored Sanctuary Mix
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Handpicked practices matched to your emotional landscape. Hover to engage.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '22px', marginBottom: '44px' }}>
          {/* Breathing Exercises */}
          {band.recommendations.breathing.map((b, idx) => {
            const currentIdx = cardGlobalIndex++;
            return (
              <TiltCard
                key={`b-${idx}`}
                maxTilt={6}
                style={{
                  height: '100%',
                  animation: 'slideUpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
                  animationDelay: `${currentIdx * 120}ms`
                }}
              >
                <div className="glass-card" style={{
                  padding: '26px',
                  borderRadius: '22px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  border: '1.5px solid rgba(82, 183, 136, 0.25)'
                }}>
                  <div>
                    <div style={{ fontSize: '2.3rem', marginBottom: '12px' }}>{b.icon}</div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-dark)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Breathing Exercise
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '8px' }}>
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
            );
          })}

          {/* Calming Games */}
          {band.recommendations.games.map((g, idx) => {
            const currentIdx = cardGlobalIndex++;
            return (
              <TiltCard
                key={`g-${idx}`}
                maxTilt={6}
                style={{
                  height: '100%',
                  animation: 'slideUpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
                  animationDelay: `${currentIdx * 120}ms`
                }}
              >
                <div className="glass-card" style={{
                  padding: '26px',
                  borderRadius: '22px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  border: '1.5px solid rgba(107, 163, 199, 0.3)'
                }}>
                  <div>
                    <div style={{ fontSize: '2.3rem', marginBottom: '12px' }}>{g.icon}</div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-sky-dark, #3e7699)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Mindful Game
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '8px' }}>
                      {g.title}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.55' }}>
                      {g.desc}
                    </p>
                  </div>
                  <Link
                    to={g.route}
                    className="btn-ghost"
                    style={{ marginTop: '20px', textAlign: 'center', textDecoration: 'none', padding: '11px', borderRadius: '12px', fontWeight: 600 }}
                  >
                    Play Game →
                  </Link>
                </div>
              </TiltCard>
            );
          })}

          {/* Yoga & Restorative Exercise */}
          {band.recommendations.yoga.map((y, idx) => {
            const currentIdx = cardGlobalIndex++;
            return (
              <TiltCard
                key={`y-${idx}`}
                maxTilt={6}
                style={{
                  height: '100%',
                  animation: 'slideUpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
                  animationDelay: `${currentIdx * 120}ms`
                }}
              >
                <div className="glass-card" style={{
                  padding: '26px',
                  borderRadius: '22px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  border: '1.5px solid rgba(157, 132, 183, 0.3)'
                }}>
                  <div>
                    <div style={{ fontSize: '2.3rem', marginBottom: '12px' }}>{y.icon}</div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-lavender-dark, #6b5286)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Yoga / Movement
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '8px' }}>
                      {y.title}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.55' }}>
                      {y.desc}
                    </p>
                  </div>
                  <Link
                    to="/routine"
                    className="btn-ghost"
                    style={{ marginTop: '20px', textAlign: 'center', textDecoration: 'none', padding: '11px', borderRadius: '12px', fontWeight: 600 }}
                  >
                    View In Routine →
                  </Link>
                </div>
              </TiltCard>
            );
          })}

          {/* Calming Music Soundscapes */}
          {band.recommendations.music.map((m, idx) => {
            const currentIdx = cardGlobalIndex++;
            return (
              <TiltCard
                key={`m-${idx}`}
                maxTilt={6}
                style={{
                  height: '100%',
                  animation: 'slideUpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
                  animationDelay: `${currentIdx * 120}ms`
                }}
              >
                <div className="glass-card" style={{
                  padding: '26px',
                  borderRadius: '22px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  border: '1.5px solid rgba(233, 154, 128, 0.3)'
                }}>
                  <div>
                    <div style={{ fontSize: '2.3rem', marginBottom: '12px' }}>{m.icon}</div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-peach-dark, #c26d52)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Calming Music
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '8px' }}>
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
                    {activeAudio === m.title ? 'Playing 🎧' : 'Listen Now 🎧'}
                  </button>
                </div>
              </TiltCard>
            );
          })}
        </div>

        {/* Task 4 Escalation Callout: "Do you still feel drained or uneasy?" */}
        <div className="glass-card" style={{
          padding: '38px 32px',
          borderRadius: '26px',
          background: 'linear-gradient(135deg, rgba(238, 246, 242, 0.95), rgba(254, 243, 199, 0.45))',
          border: '1.5px solid rgba(82, 183, 136, 0.4)',
          textAlign: 'center',
          boxShadow: '0 12px 32px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>🌱</div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Do you still feel drained or uneasy?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: '1.6', maxWidth: '640px', margin: '0 auto 24px' }}>
            MindCare recommendations are supportive wellness practices, not medical treatments. If you need a compassionate space to talk right now, choose how you would like to connect:
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleOpenCompanion}
              className="btn-primary"
              style={{ padding: '14px 28px', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 600 }}
            >
              💬 Talk to Aria (AI Companion)
            </button>

            <button
              type="button"
              onClick={() => setIsBookingOpen(true)}
              className="btn-ghost"
              style={{
                padding: '14px 28px',
                borderRadius: '14px',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderColor: 'var(--primary)',
                color: 'var(--primary-dark)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)'
              }}
            >
              🩺 Connect with a Psychiatrist / Psychologist
            </button>
          </div>

          <div style={{ marginTop: '20px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Professional sessions and clinical treatment plans are evaluated and led exclusively by licensed practitioners.
          </div>
        </div>

        {/* Clinical Booking Modal */}
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      </div>
    </div>
  );
}
