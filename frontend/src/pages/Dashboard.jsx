import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQuoteOfDay } from '../services/quotes';
import { Storage } from '../services/storage';
import { generateExplainableInsights } from '../services/aiInsights';
import { generateDailyPlan } from '../services/wellnessCoach';
import { calculateDigitalTwin } from '../services/digitalTwin';
import DigitalTwinCard from '../components/predictive/DigitalTwinCard';
import MoodForecastHorizon from '../components/predictive/MoodForecastHorizon';
import EarlyWarningNudge from '../components/predictive/EarlyWarningNudge';
import InnerWorldCanvas from '../components/three/InnerWorldCanvas';
import BookingModal from '../components/clinical/BookingModal';
import ClinicalLiveRoom from '../components/clinical/ClinicalLiveRoom';
import QuestionnaireModal from '../components/onboarding/QuestionnaireModal';

export default function Dashboard() {
  const { user } = useAuth();
  const quote = getQuoteOfDay();

  const [dailyPlan, setDailyPlan] = useState([]);
  const [insights, setInsights] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [digitalTwin, setDigitalTwin] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [mySessions, setMySessions] = useState([]);
  const [activeLiveSession, setActiveLiveSession] = useState(null);

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

    // Daily Plan from AI Wellness Coach
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

  const growthScore = Math.min(1.0, Math.max(0.2, (Math.log(1 + (user?.moodHistory?.length || 0) * 0.4 + (journalEntries.length) * 0.6 + (user?.streak || 1) * 0.3) / 2.8)));

  return (
    <div className="dashboard-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Greeting Row */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '28px'
        }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', marginBottom: '6px' }}>
              Welcome back, {user?.name || 'Friend'} 👋
            </h1>
            <p style={{ color: '#8aa9c4', fontSize: '0.95rem' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(168, 213, 240, 0.06)',
            border: '1px solid rgba(168, 213, 240, 0.15)',
            padding: '10px 20px',
            borderRadius: '100px'
          }}>
            <span style={{ fontSize: '1.3rem' }}>🔥</span>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user?.streak || 1} Day Sanctuary Streak
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Nourishing consistency</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsQuestionnaireOpen(true)}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '100px',
              fontSize: '0.88rem',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(82, 183, 136, 0.35)'
            }}
          >
            <span>📋</span>
            <span>Assessment & Onboarding Pulse</span>
          </button>
        </div>

        {/* Daily Quote Banner */}
        <div className="glass-card" style={{
          padding: '24px 30px',
          marginBottom: '32px',
          borderLeft: '4px solid var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{ fontSize: '2rem' }}>🌿</div>
          <div>
            <p style={{ fontStyle: 'italic', fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
              "{quote.text}"
            </p>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary-dark)', fontWeight: 600 }}>— {quote.author}</span>
          </div>
        </div>

        {/* AI Early Warning System (Supportive Nudge) */}
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
              <span style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>🌱</span>
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
                Expand Aura in Breathwork 🌬️
              </Link>
              <button
                onClick={() => setIsBookingOpen(true)}
                className="btn-ghost"
                style={{ padding: '9px 18px', fontSize: '0.82rem', borderColor: 'var(--border-subtle)' }}
              >
                Connect with Therapist 🩺
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

        {/* AI Mood Prediction: Emotional Horizon */}
        <MoodForecastHorizon forecast={digitalTwin?.moodForecast} />

        {/* Digital Twin Profile: Evolving Metrics */}
        <DigitalTwinCard twin={digitalTwin} />

        {/* Clinical Consultations & Appointments (Part 5) */}
        <div className="glass-card" style={{ marginBottom: '32px', padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>🩺</span>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>My Clinical Consultations</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '2px' }}>
                Private, end-to-end encrypted sessions with verified clinicians
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
                          📹 Enter Live Room
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
                <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>✦</span>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>AI Wellness Coach • Today's Sanctuary Rhythm</h3>
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
                    {item.completed && '✓'}
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
                <span style={{ fontSize: '1.2rem' }}>🔍</span>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Explainable AI Insights</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
                Transparent observations backed by specific patterns in your logged data
              </p>
            </div>
            <Link to="/roadmap" className="btn-ghost" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
              View Therapy Roadmap 🗺️
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <Link to="/mood" className="glass-card" style={{ textAlign: 'center', padding: '28px 20px', color: 'var(--text-primary)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📊</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Mood Tracker</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Log feelings and view 3D aura</p>
            </Link>

            <Link to="/breathing" className="glass-card" style={{ textAlign: 'center', padding: '28px 20px', color: 'var(--text-primary)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🌬️</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>3D Breathwork</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>4-7-8 and Box breathing guide</p>
            </Link>

            <Link to="/journal" className="glass-card" style={{ textAlign: 'center', padding: '28px 20px', color: 'var(--text-primary)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✍️</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Private Journal</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Thought defusion and gratitude</p>
            </Link>

            <Link to="/routine" className="glass-card" style={{ textAlign: 'center', padding: '28px 20px', color: 'var(--text-primary)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🌱</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Daily Routine</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Build gentle restorative habits</p>
            </Link>

            <Link to="/progress" className="glass-card" style={{ textAlign: 'center', padding: '28px 20px', color: 'var(--text-primary)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📈</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Progress & Stats</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Weekly chart and achievements</p>
            </Link>

            <Link to="/crisis" className="glass-card" style={{ textAlign: 'center', padding: '28px 20px', color: 'var(--text-primary)', borderLeft: '4px solid #dc2626' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🛡️</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '6px', color: '#b91c1c' }}>Crisis Support</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>24/7 helplines & safety plan</p>
            </Link>
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
