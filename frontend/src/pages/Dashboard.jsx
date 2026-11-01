import React, { useState, useEffect } from 'react';
import CalmBrainHero from '../components/three/CalmBrainHero';
import TiltCard from '../components/common/TiltCard';
import { Api } from '../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQuoteOfDay } from '../services/quotes';
import { getBandForScore } from '../config/questionnaire';
import { Storage } from '../services/storage';
import { generateExplainableInsights } from '../services/aiInsights';
import { generateDailyPlan } from '../services/wellnessCoach';
import { calculateDigitalTwin } from '../services/digitalTwin';
import DigitalTwinCard from '../components/predictive/DigitalTwinCard';
import MoodForecastHorizon from '../components/predictive/MoodForecastHorizon';
import EarlyWarningNudge from '../components/predictive/EarlyWarningNudge';
import InnerWorldCanvas from '../components/three/InnerWorldCanvas';
import BookingModal from '../components/clinical/BookingModal';
import BrainCanvas from '../components/common/BrainCanvas';
import '../styles/client-pages.css';
import ClinicalLiveRoom from '../components/clinical/ClinicalLiveRoom';
import QuestionnaireModal from '../components/onboarding/QuestionnaireModal';

export default function Dashboard() {
  const { user } = useAuth();
  const quote = getQuoteOfDay();

    const [selectedMood, setSelectedMood] = useState(null);
  const [moodSavedNotice, setMoodSavedNotice] = useState('');

  const MOOD_BLOBS = [
    { id: 'steady', label: 'Steady', score: 5, className: 'mood-blob-1' },
    { id: 'calm', label: 'Calm', score: 4, className: 'mood-blob-2' },
    { id: 'reflective', label: 'Reflective', score: 3, className: 'mood-blob-3' },
    { id: 'fatigued', label: 'Fatigued', score: 2, className: 'mood-blob-4' },
    { id: 'overloaded', label: 'Overloaded', score: 1, className: 'mood-blob-5' }
  ];

  const handleSelectMood = async (item) => {
    setSelectedMood(item.id);
    try {
      await Api.logMood({
        mood_score: item.score,
        tags: [item.label],
        note: `Dashboard check-in: ${item.label}`
      });
      setMoodSavedNotice(`Emotional rhythm noted: ${item.label}`);
      setTimeout(() => setMoodSavedNotice(''), 3500);
    } catch (_) {
      setMoodSavedNotice(`Emotional rhythm noted: ${item.label}`);
      setTimeout(() => setMoodSavedNotice(''), 3500);
    }
  };

  const [dailyPlan, setDailyPlan] = useState([]);
  const [insights, setInsights] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [digitalTwin, setDigitalTwin] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [mySessions, setMySessions] = useState([]);
  const [activeLiveSession, setActiveLiveSession] = useState(null);
  const [assessment, setAssessment] = useState(() => Storage.get('mindcare_assessment_result', null));
  const latestBand = assessment ? getBandForScore(assessment.totalScore) : null;
  const nextUpcomingSession = mySessions.find(s => ['confirmed', 'assigned', 'requested'].includes(s.status)) || null;
  const sanitizeSpecialist = (val) => {
    if (!val || typeof val !== 'string') return latestBand?.recommendedTherapist?.category;
    const clean = val.trim();
    if (/^general$/i.test(clean)) return latestBand?.recommendedTherapist?.category;
    return clean.replace(/^General\s+/i, '');
  };

  const therapistRec = assessment?.ai_analysis?.recommendedTherapy ? {
    category: sanitizeSpecialist(assessment.ai_analysis.recommendedSpecialist) || latestBand?.recommendedTherapist?.category,
    subtitle: assessment.ai_analysis.recommendedTherapy,
    focusAreas: assessment.ai_analysis.focusAreas || latestBand?.recommendedTherapist?.focusAreas,
    modality: assessment.ai_analysis.recommendedTherapy,
    cadence: assessment.ai_analysis.sessionFrequency || latestBand?.recommendedTherapist?.cadence,
    rationale: assessment.ai_analysis.rationale || latestBand?.recommendedTherapist?.rationale,
    clinicalSummary: assessment.ai_analysis.clinicalSummary || latestBand?.summary
  } : latestBand?.recommendedTherapist;

  const loadSessions = async () => {
    try {
      const res = await Api.getMySessions();
      if (res.success && res.sessions) {
        setMySessions(res.sessions);
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleCancelSession = async (sessionId) => {
    if (!window.confirm('Are you sure you wish to cancel this appointment?')) return;
    const res = await Api.cancelSession(sessionId, 'Cancelled by user from dashboard');
    if (res.success) {
      loadSessions();
    } else {
      alert(res.message || 'Unable to cancel appointment.');
    }
  };

  // Check if user has not completed onboarding assessment
  useEffect(() => {
    const hasCompleted = Storage.get('mindcare_has_completed_onboarding', false);
    if (!hasCompleted) {
      const timer = setTimeout(() => {
        setIsQuestionnaireOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    const journals = Storage.getJournalEntries();
    const storedRoutines = Storage.getRoutines();
    setJournalEntries(journals);
    setRoutines(storedRoutines);

    // Calculate evolving Digital Twin profile
    const twin = calculateDigitalTwin(user, journals, storedRoutines);
    setDigitalTwin(twin);

    // Explainable Insights
    const calculatedInsights = generateExplainableInsights(user, journals, storedRoutines);
    setInsights(calculatedInsights);

    // Daily Plan from Wellness Coach
    const savedPlan = Storage.getDailyPlan();
    if (savedPlan && savedPlan.length > 0) {
      setDailyPlan(savedPlan);
    } else {
      const generated = generateDailyPlan(user, journals);
      setDailyPlan(generated);
      Storage.saveDailyPlan(generated);
    }
  }, [user]);

  const toggleDailyPlanItem = (id) => {
    const updated = dailyPlan.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    setDailyPlan(updated);
    Storage.saveDailyPlan(updated);
  };

  const completedCount = dailyPlan.filter(i => i.completed).length;

  // Mood ribbon: built only from the user's own logged check-ins (nothing placeholder)
  const moodRibbon = (() => {
    const e = (user?.moodHistory || []).filter(m => Number.isFinite(Number(m.intensity))).slice(0, 7).reverse();
    if (e.length < 2) return null;
    const vals = e.map(m => Number(m.intensity)); const lo = Math.min(...vals), hi = Math.max(...vals, lo + 1);
    const W = 600, H = 110, step = W / (e.length - 1);
    const pts = e.map((m, k) => ({ x: k * step, y: H - 14 - ((Number(m.intensity) - lo) / (hi - lo)) * (H - 30), label: `${m.mood || 'check-in'} · ${new Date(m.date || m.timestamp).toLocaleDateString()}` }));
    const line = pts.map((p, k) => k === 0 ? `M${p.x},${p.y}` : `C${pts[k - 1].x + step / 2},${pts[k - 1].y} ${p.x - step / 2},${p.y} ${p.x},${p.y}`).join(' ');
    return { pts, line, area: `${line} L${W},${H} L0,${H} Z`, n: e.length };
  })();

  const growthScore = Math.min(1.0, Math.max(0.2, (Math.log(1 + (user?.moodHistory?.length || 0) * 0.4 + (journalEntries.length) * 0.6 + (user?.streak || 1) * 0.3) / 2.8)));

  return (
    <div className="dashboard-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Greeting hero — big serif greeting + small breathing brain */}
        <section className="dash-hero">
          <div className="dash-hero-copy">
            <p className="eyebrow">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <h1>Welcome back, <em>{user?.name || 'Friend'}</em></h1>
            <figure className="dash-quote">
              <blockquote>“{quote.text}”</blockquote>
              <figcaption>— {quote.author}</figcaption>
            </figure>
            <div className="dash-hero-actions">
              <button type="button" onClick={() => setIsQuestionnaireOpen(true)} className="btn-primary">
                <span>Assessment &amp; Onboarding Pulse</span>
              </button>
              <span className="dash-streak num"><b>{user?.streak || 1}</b> day sanctuary streak</span>
            </div>
          </div>
          <div className="dash-hero-brain">
            <div className="dash-brain-window"><BrainCanvas calm={1} pulses={20} /></div>
            <p className="dash-breathe" aria-hidden="true"><span>Breathe in</span><span>Breathe out</span></p>
          </div>
        </section>

        {moodRibbon && (
          <section className="dash-ribbon" aria-label="Your recent mood intensity">
            <div className="ph"><h2>Your last check-ins</h2><span className="muted small">{moodRibbon.n} entries</span></div>
            <svg viewBox="0 0 600 110" role="img" aria-label="Mood intensity over your recent check-ins">
              <defs><linearGradient id="dashRg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--accent-sprout)" /><stop offset="1" stopColor="#FBF8F3" stopOpacity="0" /></linearGradient></defs>
              <path d={moodRibbon.area} fill="url(#dashRg)" opacity=".5" />
              <path d={moodRibbon.line} fill="none" stroke="var(--accent-forest)" strokeWidth="2.5" strokeLinecap="round" pathLength="1" className="ribbon-draw" />
              {moodRibbon.pts.map((p, k) => <circle key={k} cx={p.x} cy={p.y} r="4" fill="#fff" stroke="var(--accent-forest)" strokeWidth="2"><title>{p.label}</title></circle>)}
            </svg>
          </section>
        )}

        {/* Clinician Recommendation Card based on Assessment */}
        {therapistRec && (
          <div className="glass-card" style={{
            padding: '24px 28px',
            marginBottom: '32px',
            backgroundColor: '#ffffff',
            border: `1.5px solid ${latestBand?.themeColor || 'var(--primary)'}44`,
            borderRadius: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  backgroundColor: `${latestBand?.themeColor || '#2d6a4f'}18`,
                  color: latestBand?.themeColor || '#2d6a4f',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: '6px'
                }}>
                  Assessment-Matched Clinician Recommendation
                </span>
                {therapistRec.category && !/^general$/i.test(therapistRec.category.trim()) && (
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {therapistRec.category.replace(/^General\s+/i, '')}
                  </h3>
                )}
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  Based on your reflection score ({assessment?.totalScore}/24 · {latestBand?.title}): {therapistRec.subtitle}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link
                  to="/recommendations"
                  className="btn-ghost"
                  style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}
                >
                  View Full Report
                </Link>
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(true)}
                  className="btn-primary"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    backgroundColor: latestBand?.themeColor || 'var(--primary)',
                    borderColor: latestBand?.themeColor || 'var(--primary)'
                  }}
                >
                  Consult Matched Specialist →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Early Warning Wellness Monitor (Supportive Nudge) */}
        <EarlyWarningNudge
          warning={digitalTwin?.earlyWarning}
          onDismiss={() => {
            if (digitalTwin) {
              setDigitalTwin({
                ...digitalTwin,
                earlyWarning: { ...digitalTwin.earlyWarning, active: false }
              });
            }
          }}
        />

        {/* 3D LIVING INNER WORLD SANCTUARY PANEL */}
        <div className="glass-card" style={{
          marginBottom: '32px',
          padding: '28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          alignItems: 'center',
          gap: '28px',
          border: '1px solid rgba(82, 183, 136, 0.3)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--primary-dark)', fontWeight: 700 }}>
                Your Evolving Sanctuary
              </span>
            </div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              The Living Inner World
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '20px' }}>
              This procedural tree is your living digital sanctuary. As you log check-ins, journal reflections, and practice mindful breathwork, its branches and sunlit canopy organically fill in.
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span style={{
                background: 'rgba(82, 183, 136, 0.12)',
                border: '1px solid rgba(82, 183, 136, 0.28)',
                color: 'var(--primary-dark)',
                padding: '4px 12px',
                borderRadius: '100px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                Stage: {growthScore < 0.4 ? 'Slender Sapling' : growthScore < 0.75 ? 'Branching Awareness' : 'Blossoming Resilience'}
              </span>
              <span style={{
                background: 'rgba(114, 161, 191, 0.12)',
                border: '1px solid rgba(114, 161, 191, 0.28)',
                color: '#2b5f7d',
                padding: '4px 12px',
                borderRadius: '100px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                Still Water Reflections Active
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/breathing" className="btn-primary" style={{ padding: '9px 18px', fontSize: '0.82rem' }}>
                Expand Aura in Breathwork
              </Link>
              <button
                onClick={() => setIsBookingOpen(true)}
                className="btn-ghost"
                style={{ padding: '9px 18px', fontSize: '0.82rem', borderColor: 'var(--border-subtle)' }}
              >
                Connect with Therapist
              </button>
            </div>
          </div>

          {/* 3D Canvas Viewport */}
          <div style={{
            height: '280px',
            background: 'linear-gradient(180deg, #f1f7f2 0%, #e6efe8 100%)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 8px rgba(33, 64, 47, 0.05)'
          }}>
            <InnerWorldCanvas mode="panel" growthLevel={growthScore} />
          </div>
        </div>

        {/* Mood Forecast Horizon: Emotional Horizon */}
        <MoodForecastHorizon forecast={digitalTwin?.moodForecast} />

        {/* Digital Twin Profile: Evolving Metrics */}
        <DigitalTwinCard twin={digitalTwin} />

        {/* Clinical Consultations & Appointments (Part 5) */}
        <div className="glass-card" style={{ marginBottom: '32px', padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>My Therapist Consultations</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '2px' }}>
                Private, end-to-end encrypted 1-on-1 sessions with verified therapists & doctors
              </p>
            </div>
            <button
              onClick={() => setIsBookingOpen(true)}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            >
              + Request Consultation
            </button>
          </div>

          {mySessions.length === 0 ? (
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 12px 0' }}>
                You have no active or upcoming clinical appointments scheduled.
              </p>
              <button
                onClick={() => setIsBookingOpen(true)}
                className="btn-ghost"
                style={{ fontSize: '0.82rem', padding: '6px 16px' }}
              >
                Schedule First Consultation
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mySessions.map((session) => {
                const isConfirmed = session.status === 'confirmed';
                const canCancel = ['requested', 'under_admin_review', 'assigned', 'confirmed'].includes(session.status);
                const statusLabels = {
                  requested: { text: 'Requested (Coordination Queued)', bg: 'rgba(246, 189, 96, 0.15)', color: '#b07d3b' },
                  under_admin_review: { text: 'Under Clinical Review', bg: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' },
                  assigned: { text: 'Clinician Assigned', bg: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' },
                  therapist_accepted: { text: 'Clinician Accepted (Awaiting Confirmation)', bg: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' },
                  confirmed: { text: 'Confirmed', bg: 'rgba(82, 183, 136, 0.2)', color: 'var(--primary-dark)' },
                  completed: { text: 'Completed', bg: 'rgba(107, 114, 128, 0.15)', color: '#4b5563' },
                  admin_rejected: { text: 'Declined / Re-route Suggested', bg: 'rgba(239, 68, 68, 0.12)', color: '#dc2626' },
                  cancelled_by_user: { text: 'Cancelled', bg: 'rgba(107, 114, 128, 0.15)', color: '#4b5563' }
                };
                const badge = statusLabels[session.status] || { text: session.status, bg: 'var(--bg-glass)', color: 'var(--text-secondary)' };

                return (
                  <div
                    key={session.id}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                          {session.therapist?.name || 'Clinical Care Practitioner'}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '100px',
                          background: badge.bg,
                          color: badge.color
                        }}>
                          {badge.text}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Mode: <strong>{session.mode?.toUpperCase()}</strong> • Duration: {session.slot_duration_minutes || 45} min • Scheduled: {new Date(session.preferred_slot).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      {session.rejection_reason && (
                        <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px' }}>
                          Note: {session.rejection_reason}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {isConfirmed && (
                        <button
                          onClick={() => setActiveLiveSession(session)}
                          className="btn-primary"
                          style={{ padding: '7px 16px', fontSize: '0.82rem' }}
                        >
                           Enter Live Room
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => handleCancelSession(session.id)}
                          className="btn-ghost"
                          style={{ padding: '7px 14px', fontSize: '0.78rem', color: '#b91c1c' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Booking Request Modal */}
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          onBooked={loadSessions}
        />

        {/* Live Gated Clinical Room */}
        {activeLiveSession && (
          <ClinicalLiveRoom
            isOpen={Boolean(activeLiveSession)}
            onClose={() => setActiveLiveSession(null)}
            roomId={activeLiveSession.id}
            initialMode={activeLiveSession.mode || 'video'}
            peerName={activeLiveSession.therapist?.name || 'Clinical Practitioner'}
            peerRole={activeLiveSession.therapist?.title || 'Licensed Clinical Psychologist'}
          />
        )}

        {/* AI WELLNESS COACH: DAILY PLAN */}
        <div className="glass-card" style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-forest, #245741)' }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Wellness Coach • Today's Sanctuary Rhythm</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
                Auto-generated daily restoration plan based on your recent activity
              </p>
            </div>
            <div style={{
              background: 'rgba(82, 183, 136, 0.12)',
              border: '1px solid rgba(82, 183, 136, 0.3)',
              color: 'var(--primary-dark)',
              padding: '6px 14px',
              borderRadius: '100px',
              fontSize: '0.82rem',
              fontWeight: 600
            }}>
              {completedCount} / {dailyPlan.length} Steps Nurtured
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {dailyPlan.map(item => (
              <div
                key={item.id}
                onClick={() => toggleDailyPlanItem(item.id)}
                className={item.route === '/journal' ? 'hide-on-mobile journal-mobile-hide' : ''}
                style={{
                  background: item.completed ? 'rgba(82, 183, 136, 0.1)' : 'var(--bg-surface-elevated)',
                  border: `1px solid ${item.completed ? 'rgba(82, 183, 136, 0.35)' : 'var(--border-subtle)'}`,
                  borderRadius: '16px',
                  padding: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.6rem' }}>{item.icon}</span>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    border: `2px solid ${item.completed ? 'var(--primary)' : 'var(--border-hover)'}`,
                    background: item.completed ? 'var(--primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 800
                  }}>
                    {item.completed && ''}
                  </div>
                </div>
                <h4 style={{
                  fontSize: '0.98rem',
                  marginBottom: '4px',
                  textDecoration: item.completed ? 'line-through' : 'none',
                  color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.subtitle}</p>
                {item.route && (
                  <Link
                    to={item.route}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-block',
                      marginTop: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--primary-dark)'
                    }}
                  >
                    Open Activity →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* EXPLAINABLE AI INSIGHTS */}
        <div className="glass-card" style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-forest, #245741)' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Explainable Reflective Insights</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
                Transparent observations backed by specific patterns in your logged data
              </p>
            </div>
            <Link to="/roadmap" className="btn-ghost" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
              View Therapy Roadmap 
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {insights.map(ins => (
              <div
                key={ins.id}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '18px',
                  padding: '22px',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      color: 'var(--primary-dark)',
                      marginBottom: '4px'
                    }}>
                      {ins.category}
                    </span>
                    <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{ins.title}</h4>
                  </div>
                  {ins.actionRoute && (
                    <Link to={ins.actionRoute} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
                      {ins.actionLabel} →
                    </Link>
                  )}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '16px' }}>{ins.observation}</p>

                {/* Transparent Reasoning Badges */}
                <div style={{
                  background: 'rgba(82, 183, 136, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '14px'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    Why MindCare Observed This:
                  </div>
                  <ul style={{ paddingLeft: '18px', fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {ins.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--primary-dark)' }}>
                  <strong>Recommendation:</strong> {ins.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Modules Quick Actions */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>
            Sanctuary Hub
          </h3>
          <div className="rd-rows">
            {[
              ['/mood', 'Mood Tracker', 'Log feelings and view 3D aura'],
              ['/breathing', '3D Breathwork', '4-7-8 and Box breathing guide'],
              ['/journal', 'Private Journal', 'Thought defusion and gratitude'],
              ['/routine', 'Daily Routine', 'Build gentle restorative habits'],
              ['/progress', 'Progress & Stats', 'Weekly chart and achievements'],
              ['/crisis', 'Crisis Support', '24/7 helplines & safety plan']
            ].map(([to, title, sub]) => (
              <Link key={to} to={to} className={`rd-row ${to === '/journal' ? 'hide-on-mobile journal-mobile-hide' : ''}`}>
                <span><b style={to === '/crisis' ? { color: 'var(--color-error-text, #b91c1c)' } : undefined}>{title}</b><span className="sub">{sub}</span></span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
        {/* Onboarding & Clinical Questionnaire Popup */}
        <QuestionnaireModal
          isOpen={isQuestionnaireOpen}
          onClose={() => setIsQuestionnaireOpen(false)}
          onComplete={(rec) => {
            setIsQuestionnaireOpen(false);
          }}
        />
      </div>
    </div>
  );
}
