// ============================================
// MindCare Sanctuary — Guided 3D Breathwork
// Powered by BreathingOrbCanvas (Single WebGL canvas)
// Timings & patterns imported from centralized config: frontend/src/config/breathing.js
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import BreathingOrbCanvas from '../components/three/BreathingOrbCanvas';
import { BREATHING_PATTERNS, DEFAULT_BREATHING_PATTERN_KEY } from '../config/breathing';
import { soundEngine } from '../services/audio';
import { Storage } from '../services/storage';

export default function Breathing() {
  const [selectedPatternKey, setSelectedPatternKey] = useState(DEFAULT_BREATHING_PATTERN_KEY);
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Sound: Default off / respect persisted user setting & quiet / reduced-motion preferences
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const persisted = Storage.get('mindcare_sound_enabled', null);
      if (persisted !== null) return Boolean(persisted);

      // Default to muted if user has reduced-motion or quiet mode
      const reducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const quietMode = Storage.get('mindcare_reduce_motion', false) || Storage.get('mindcare_quiet_mode', false);
      if (reducedMotion || quietMode) return false;

      return false; // Safe opt-in: no automatic unexpected sound
    } catch (_) {
      return false;
    }
  });

  const pattern = BREATHING_PATTERNS[selectedPatternKey] || BREATHING_PATTERNS[DEFAULT_BREATHING_PATTERN_KEY];
  const currentPhase = pattern.phases[phaseIndex] || pattern.phases[0];
  const [secondsRemaining, setSecondsRemaining] = useState(pattern.phases[0].duration);
  const intervalRef = useRef(null);

  // Persist sound preference whenever user changes it
  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      Storage.set('mindcare_sound_enabled', next);
      return next;
    });
  };

  useEffect(() => {
    if (!isRunning) return;

    // Chimes only trigger after explicit user action has started the session
    if (soundEnabled) {
      soundEngine.playChime(currentPhase.name.toLowerCase());
    }

    setSecondsRemaining(currentPhase.duration);

    // 500ms tick to smoothly accommodate 5.5s resonant flow
    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = Math.round((prev - 0.5) * 10) / 10;
        if (next <= 0) {
          setPhaseIndex((currIdx) => {
            const nextIdx = (currIdx + 1) % pattern.phases.length;
            if (nextIdx === 0) {
              setCompletedCycles((c) => c + 1);
            }
            return nextIdx;
          });
          return 0;
        }
        return next;
      });
    }, 500);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, phaseIndex, selectedPatternKey, soundEnabled, pattern.phases, currentPhase.name, currentPhase.duration]);

  const handleStartStop = () => {
    if (isRunning) {
      setIsRunning(false);
      clearInterval(intervalRef.current);
    } else {
      setPhaseIndex(0);
      setSecondsRemaining(pattern.phases[0].duration);
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setPhaseIndex(0);
    setSecondsRemaining(pattern.phases[0].duration);
    setCompletedCycles(0);
  };

  const handleSelectPattern = (key) => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setSelectedPatternKey(key);
    setPhaseIndex(0);
    const target = BREATHING_PATTERNS[key] || pattern;
    setSecondsRemaining(target.phases[0].duration);
    setCompletedCycles(0);
  };

  const phaseColors = {
    Inhale: { badge: '#2d6a4f', bg: 'rgba(82, 183, 136, 0.15)', border: 'rgba(82, 183, 136, 0.4)' },
    Hold: { badge: '#b07d3b', bg: 'rgba(246, 189, 96, 0.18)', border: 'rgba(246, 189, 96, 0.4)' },
    Exhale: { badge: '#2b5f7d', bg: 'rgba(107, 163, 199, 0.18)', border: 'rgba(107, 163, 199, 0.4)' }
  };

  const activeTheme = phaseColors[currentPhase.name] || phaseColors.Inhale;

  return (
    <div className="breathing-page" style={{ position: 'relative', padding: '40px 24px 80px', minHeight: '100vh', backgroundColor: 'var(--bg-main, #f8fbf9)' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--primary-dark)', fontWeight: 700 }}>
          Somatic Autonomic Regulation
        </span>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', marginTop: '6px', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 700 }}>
          Guided 3D Breathwork
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
          Follow the soft glowing respiratory orb. Inhale as it gently expands, rest in stillness, and release as it returns to center.
        </p>

        {/* Pattern Selector Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '32px'
        }}>
          {Object.entries(BREATHING_PATTERNS).map(([key, pat]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectPattern(key)}
              style={{
                background: selectedPatternKey === key ? 'rgba(82, 183, 136, 0.18)' : 'var(--bg-card, #ffffff)',
                border: `1.5px solid ${selectedPatternKey === key ? 'var(--primary)' : 'var(--border-subtle, rgba(82, 183, 136, 0.2))'}`,
                color: selectedPatternKey === key ? 'var(--primary-dark)' : 'var(--text-secondary)',
                padding: '10px 22px',
                borderRadius: '100px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: selectedPatternKey === key ? '0 4px 14px rgba(82, 183, 136, 0.2)' : '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              {pat.name}
            </button>
          ))}
        </div>

        {/* 3D Breathing Orb Guide Card */}
        <div className="glass-card" style={{
          padding: '36px 24px',
          marginBottom: '32px',
          borderRadius: '28px',
          border: '1.5px solid rgba(82, 183, 136, 0.3)',
          backgroundColor: '#ffffff',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.05)',
          position: 'relative'
        }}>
          {/* Phase Badge */}
          <div style={{
            display: 'inline-block',
            fontSize: '1.1rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: activeTheme.badge,
            background: activeTheme.bg,
            border: `1px solid ${activeTheme.border}`,
            padding: '6px 20px',
            borderRadius: '100px',
            marginBottom: '12px',
            transition: 'all 0.4s ease'
          }}>
            {isRunning ? currentPhase.name.toUpperCase() : 'READY TO BEGIN'}
          </div>

          <div style={{
            fontSize: 'clamp(2.8rem, 6vw, 3.6rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            marginBottom: '8px'
          }}>
            {isRunning ? `${secondsRemaining % 1 === 0 ? secondsRemaining : secondsRemaining.toFixed(1)}s` : `${pattern.phases[0].duration}s`}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', minHeight: '26px', marginBottom: '16px' }}>
            {isRunning ? currentPhase.tip : pattern.description}
          </p>

          {/* Central 3D Breathing Orb Canvas Mount */}
          <div style={{
            width: '100%',
            maxWidth: '380px',
            height: '340px',
            margin: '0 auto',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BreathingOrbCanvas
              size="compact"
              breathingPhase={isRunning ? currentPhase.name : null}
              phaseDuration={currentPhase.duration}
              secondsRemaining={secondsRemaining}
              interactive={true}
            />
          </div>

          {/* Cycles Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            marginTop: '16px',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)'
          }}>
            <div>
              Completed Cycles: <strong style={{ color: 'var(--text-primary)' }}>{completedCycles}</strong>
            </div>
            <div>
              Chime Cue: <strong style={{ color: soundEnabled ? 'var(--primary-dark)' : 'var(--text-muted)' }}>{soundEnabled ? 'Enabled' : 'Muted'}</strong>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleStartStop}
            className="btn-primary"
            style={{
              minWidth: '200px',
              padding: '14px 36px',
              fontSize: '1.05rem',
              fontWeight: 600,
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(82, 183, 136, 0.35)'
            }}
          >
            {isRunning ? 'Pause Sanctuary ⏸' : 'Start Session ▶'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="btn-ghost"
            style={{ padding: '14px 26px', borderRadius: '16px', fontWeight: 600 }}
          >
            ↺ Reset
          </button>

          <button
            type="button"
            onClick={handleToggleSound}
            className="btn-ghost"
            style={{ padding: '14px 24px', borderRadius: '16px' }}
            aria-label={soundEnabled ? 'Mute singing chime' : 'Enable singing chime'}
            title={soundEnabled ? 'Mute singing chime' : 'Enable singing chime'}
          >
            {soundEnabled ? '🔔 Chimes On' : '🔕 Chimes Off'}
          </button>
        </div>
      </div>
    </div>
  );
}
