import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MOOD_CONFIG } from '../services/quotes';
import { Storage } from '../services/storage';
import { calculateDigitalTwin } from '../services/digitalTwin';
import MoodAtmosphereCanvas from '../components/three/MoodAtmosphereCanvas';
import MoodForecastHorizon from '../components/predictive/MoodForecastHorizon';
import InnerWorldCanvas from '../components/three/InnerWorldCanvas';
import BiometricSandboxModal from '../components/predictive/BiometricSandboxModal';

export default function MoodTracker() {
  const { user, addMood } = useAuth();
  const [selectedMood, setSelectedMood] = useState('calm');
  const [intensity, setIntensity] = useState(6);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedMoodInfo, setSavedMoodInfo] = useState(null);
  const [loggedNotification, setLoggedNotification] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [twin, setTwin] = useState(null);
  const [moodRipple, setMoodRipple] = useState(null);
  const [localMoodHistory, setLocalMoodHistory] = useState([]);

  useEffect(() => {
    if (user?.moodHistory) {
      setLocalMoodHistory(user.moodHistory);
    }
  }, [user]);

  useEffect(() => {
    const calculated = calculateDigitalTwin(user, Storage.getJournalEntries(), Storage.getRoutines());
    setTwin(calculated);
  }, [user]);

  // Quick assessment state
  const [assessmentAnswers, setAssessmentAnswers] = useState({ q1: 1, q2: 1, q3: 1 });
  const [assessmentResult, setAssessmentResult] = useState(null);

  const moodEntries = localMoodHistory.length > 0 ? localMoodHistory : (user?.moodHistory || []);

  const handleSaveMood = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    const moodToLog = selectedMood;
    const intensityToLog = intensity;
    const noteToLog = note;

    try {
      const entry = addMood(moodToLog, intensityToLog, noteToLog);

      if (entry) {
        setLocalMoodHistory(prev => [entry, ...prev.filter(m => m.id !== entry.id)]);
      }

      setSavedMoodInfo({
        mood: moodToLog,
        intensity: intensityToLog,
        label: MOOD_CONFIG[moodToLog]?.label || moodToLog,
        emoji: MOOD_CONFIG[moodToLog]?.emoji || '🌿'
      });

      setNote('');
      setIsSaving(false);
      setIsSaved(true);
      setLoggedNotification(true);
      setMoodRipple(Date.now()); // Trigger tranquil 3D water ripple!

      setTimeout(() => {
        setIsSaved(false);
      }, 4000);

      setTimeout(() => {
        setLoggedNotification(false);
      }, 5000);

      const updatedTwin = calculateDigitalTwin(user, Storage.getJournalEntries(), Storage.getRoutines());
      setTwin(updatedTwin);
    } catch (err) {
      console.error('Failed to log mood:', err);
      setIsSaving(false);
    }
  };

  const handleAssessmentSubmit = (e) => {
    e.preventDefault();
    const score = Number(assessmentAnswers.q1) + Number(assessmentAnswers.q2) + Number(assessmentAnswers.q3);
    let outcome = { level: 'Mild / Balanced', text: 'Your emotional load appears manageable. Maintain your daily restorative breathwork.', mood: 'calm' };
    if (score >= 6) {
      outcome = { level: 'Elevated Tension', text: 'You are carrying noticeable emotional fatigue. Prioritize rest and consider checking out the crisis safety plan.', mood: 'stressed' };
    } else if (score >= 4) {
      outcome = { level: 'Moderate Strain', text: 'Some strain detected. Try defusing racing thoughts in your private journal.', mood: 'anxious' };
    }
    setAssessmentResult(outcome);
    setSelectedMood(outcome.mood);
  };

  return (
    <div className="mood-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh' }}>
      <MoodAtmosphereCanvas mood={selectedMood} />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Living Sanctuary Tree Card */}
        <div className="glass-card" style={{
          marginBottom: '28px',
          padding: '20px 24px',
          borderRadius: '24px',
          border: '1px solid rgba(82, 183, 136, 0.25)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(240, 247, 242, 0.7))',
          boxShadow: '0 12px 32px rgba(45, 106, 79, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-forest)', fontWeight: 700 }}>
              Living 3D Sanctuary Tree ✦
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Atmosphere: <strong style={{ color: 'var(--accent-forest)' }}>{MOOD_CONFIG[selectedMood]?.label || 'Calm'}</strong>
            </span>
          </div>
          <div style={{ height: '280px', width: '100%', position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
            <InnerWorldCanvas mode="panel" rippleTrigger={moodRipple} moodColor={MOOD_CONFIG[selectedMood]?.color} growthLevel={0.65} />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--primary-dark)', fontWeight: 700 }}>
            Emotional Rhythm
          </span>
          <h1 style={{ fontSize: '2.4rem', marginTop: '6px', marginBottom: '8px', color: 'var(--text-primary)' }}>How does your space feel today?</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Notice the 3D sanctuary atmosphere shift colors smoothly to harmonize with your emotional state.
          </p>
        </div>

        {loggedNotification && (
          <div style={{
            background: 'rgba(82, 183, 136, 0.18)',
            border: '1px solid rgba(82, 183, 136, 0.45)',
            color: 'var(--primary-dark)',
            padding: '14px 20px',
            borderRadius: '14px',
            textAlign: 'center',
            marginBottom: '24px',
            fontWeight: 600,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            ✓ Mood logged with compassion. Your 3D atmosphere and history have synchronized.
          </div>
        )}

        {/* Check-in Card */}
        <div className="glass-card" style={{ marginBottom: '36px' }}>
          <form onSubmit={handleSaveMood}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Select Your Dominant Emotion
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(85px, 1fr))',
                gap: '12px'
              }}>
                {Object.entries(MOOD_CONFIG).map(([key, config]) => {
                  const isSelected = selectedMood === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedMood(key)}
                      style={{
                        background: isSelected ? 'rgba(82, 183, 136, 0.18)' : 'var(--bg-surface)',
                        border: `2px solid ${isSelected ? config.hex || 'var(--primary)' : 'var(--border-subtle)'}`,
                        borderRadius: '16px',
                        padding: '16px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.25s ease',
                        boxShadow: isSelected ? `0 4px 14px rgba(33, 64, 47, 0.12)` : 'none'
                      }}
                    >
                      <span style={{ fontSize: '1.8rem' }}>{config.emoji}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? 'var(--primary-dark)' : 'var(--text-secondary)' }}>
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intensity Slider */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Emotional Intensity</span>
                <span style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>{intensity} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>1 — Subtle whisper</span>
                <span>5 — Moderate awareness</span>
                <span>10 — Highly acute</span>
              </div>
            </div>

            {/* Note Textarea */}
            <div className="input-group">
              <label className="input-label">Brief Context (Optional)</label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="What might be contributing to this feeling? (e.g. work deadline, restful walk, sleep quality)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving}
                style={{
                  flex: 1,
                  minWidth: '220px',
                  background: isSaved
                    ? 'linear-gradient(135deg, #1b4332, #2d6a4f)'
                    : undefined,
                  boxShadow: isSaved
                    ? '0 0 20px rgba(82, 183, 136, 0.6)'
                    : undefined,
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isSaved ? 'scale(1.02)' : 'scale(1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: isSaving ? 'wait' : 'pointer'
                }}
              >
                {isSaving ? (
                  <>
                    <span style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    <span>Saving to Sanctuary...</span>
                  </>
                ) : isSaved ? (
                  <>
                    <span style={{ fontSize: '1.25rem' }}>✓</span>
                    <span>Saved to Sanctuary! 🌿</span>
                  </>
                ) : (
                  <>
                    <span>Save Mood Check-in</span>
                    <span style={{ fontSize: '1.1rem' }}>✦</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowBiometrics(true)}
                style={{ borderColor: 'rgba(212, 163, 115, 0.4)' }}
                title="Verify local RAM-only acoustic & facial emotion signals"
              >
                Ephemeral Biometrics & Sensor Sandbox 🔬
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowAssessment(!showAssessment)}
              >
                {showAssessment ? 'Close Check-in Tool' : '3-Question Wellbeing Pulse 📋'}
              </button>
            </div>

            {/* Direct Inline Confirmation right under the button */}
            {isSaved && savedMoodInfo && (
              <div style={{
                marginTop: '16px',
                background: 'rgba(82, 183, 136, 0.16)',
                border: '1.5px solid rgba(82, 183, 136, 0.45)',
                borderRadius: '14px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                color: 'var(--primary-dark)',
                fontWeight: 600,
                fontSize: '0.92rem',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{savedMoodInfo.emoji}</span>
                  <div>
                    <div><strong>{savedMoodInfo.label}</strong> Check-in Recorded! (Intensity: {savedMoodInfo.intensity}/10)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                      Your 3D atmosphere, digital twin, and recent logs below have synchronized.
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>✦</span>
              </div>
            )}
          </form>
        </div>

        {/* Ephemeral Biometrics Sandbox Modal */}
        <BiometricSandboxModal
          isOpen={showBiometrics}
          onClose={() => setShowBiometrics(false)}
          onCalibrationComplete={() => {
            const updated = calculateDigitalTwin(user, Storage.getJournalEntries(), Storage.getRoutines());
            setTwin(updated);
          }}
        />

        {/* 3-Question Wellbeing Pulse Modal/Section */}
        {showAssessment && (
          <div className="glass-card" style={{ marginBottom: '36px', border: '1px solid var(--border-hover)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px', color: 'var(--text-primary)' }}>📋 3-Question Wellbeing Pulse</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              A rapid, evidence-informed screener based on GAD-7 and PHQ-9 emotional load metrics.
            </p>

            <form onSubmit={handleAssessmentSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  1. Over the last 24 hours, how often have you felt nervous, anxious, or on edge?
                </p>
                <select
                  className="input-field"
                  value={assessmentAnswers.q1}
                  onChange={(e) => setAssessmentAnswers({ ...assessmentAnswers, q1: e.target.value })}
                >
                  <option value="0">Not at all (0)</option>
                  <option value="1">Several times (1)</option>
                  <option value="2">Most of the day (2)</option>
                  <option value="3">Nearly constantly (3)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  2. How challenging has it felt to relax or unwind your physical body?
                </p>
                <select
                  className="input-field"
                  value={assessmentAnswers.q2}
                  onChange={(e) => setAssessmentAnswers({ ...assessmentAnswers, q2: e.target.value })}
                >
                  <option value="0">Easy to relax (0)</option>
                  <option value="1">Slight muscle tension (1)</option>
                  <option value="2">Very hard to stay calm (2)</option>
                  <option value="3">Completely unable to relax (3)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  3. Have you felt drained of energy or enthusiasm for your day?
                </p>
                <select
                  className="input-field"
                  value={assessmentAnswers.q3}
                  onChange={(e) => setAssessmentAnswers({ ...assessmentAnswers, q3: e.target.value })}
                >
                  <option value="0">Energized (0)</option>
                  <option value="1">Mild tiredness (1)</option>
                  <option value="2">Heavy lethargy (2)</option>
                  <option value="3">Exhausted (3)</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Compute Pulse Insight
              </button>
            </form>

            {assessmentResult && (
              <div style={{
                marginTop: '20px',
                background: 'rgba(82, 183, 136, 0.12)',
                border: '1px solid rgba(82, 183, 136, 0.28)',
                borderRadius: '14px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '4px' }}>
                  Result: {assessmentResult.level}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{assessmentResult.text}</p>
              </div>
            )}
          </div>
        )}

        {/* AI Mood Prediction Horizon */}
        <MoodForecastHorizon forecast={twin?.moodForecast} />

        {/* History List */}
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Recent Check-in Logs</h3>
          {moodEntries.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
              No moods recorded yet. Log your first check-in above to begin tracking your weekly equilibrium.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {moodEntries.slice(0, 8).map(m => {
                const conf = MOOD_CONFIG[m.mood] || { emoji: '🌿', label: m.mood };
                return (
                  <div
                    key={m.id}
                    className="glass-card"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '2rem' }}>{conf.emoji}</span>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{conf.label}</div>
                        {m.note && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>"{m.note}"</div>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                        Intensity: {m.intensity} / 10
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
