import React, { useState, useEffect, useRef } from 'react';
import InnerWorldCanvas from '../components/three/InnerWorldCanvas';
import AmbientCanvas from '../components/three/AmbientCanvas';
import { soundEngine } from '../services/audio';

const PATTERNS = {
  '478': {
    name: '4-7-8 Deep Relaxation',
    description: 'Activates the parasympathetic nervous system to soothe adrenaline and anxiety.',
    phases: [
      { name: 'Inhale', duration: 4, tip: 'Breathe gently in through the nose' },
      { name: 'Hold', duration: 7, tip: 'Retain the breath with soft stillness' },
      { name: 'Exhale', duration: 8, tip: 'Release fully through parted lips with a soft sigh' }
    ]
  },
  'box': {
    name: 'Box Breathing (Square)',
    description: 'Stabilizes heart rate variability and enhances grounded mental concentration.',
    phases: [
      { name: 'Inhale', duration: 4, tip: 'Fill lungs smoothly' },
      { name: 'Hold', duration: 4, tip: 'Maintain stillness at full expansion' },
      { name: 'Exhale', duration: 4, tip: 'Empty lungs steadily' },
      { name: 'Hold', duration: 4, tip: 'Pause gently at empty' }
    ]
  },
  'calm': {
    name: 'Coherent Flow (5-5)',
    description: 'Synchronizes respiration with heart rate rhythm for rapid emotional equilibrium.',
    phases: [
      { name: 'Inhale', duration: 5, tip: 'Slow, deep, diaphragmatic breath' },
      { name: 'Exhale', duration: 5, tip: 'Even, peaceful surrender of breath' }
    ]
  }
};

export default function Breathing() {
  const [selectedPatternKey, setSelectedPatternKey] = useState('478');
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const pattern = PATTERNS[selectedPatternKey];
  const currentPhase = pattern.phases[phaseIndex];

  const intervalRef = useRef(null);

  // Transition helper
  useEffect(() => {
    if (!isRunning) return;

    if (soundEnabled) {
      soundEngine.playChime(currentPhase.name.toLowerCase());
    }

    setSecondsRemaining(currentPhase.duration);

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Advance phase
          setPhaseIndex((currIdx) => {
            const nextIdx = (currIdx + 1) % pattern.phases.length;
            if (nextIdx === 0) {
              setCompletedCycles((c) => c + 1);
            }
            return nextIdx;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, phaseIndex, selectedPatternKey]);

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
    setSecondsRemaining(PATTERNS[key].phases[0].duration);
    setCompletedCycles(0);
  };

  return (
    <div className="breathing-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh' }}>
      <AmbientCanvas count={25} speed={0.2} />

      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--primary-dark)', fontWeight: 700 }}>
          Somatic Regulation
        </span>
        <h1 style={{ fontSize: '2.4rem', marginTop: '6px', marginBottom: '8px', color: 'var(--text-primary)' }}>Guided 3D Breathwork</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '32px' }}>
          Sync your breath with the expanding and contracting organic particle guide.
        </p>

        {/* Pattern Selector Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '32px'
        }}>
          {Object.entries(PATTERNS).map(([key, pat]) => (
            <button
              key={key}
              onClick={() => handleSelectPattern(key)}
              style={{
                background: selectedPatternKey === key ? 'rgba(82, 183, 136, 0.2)' : 'var(--bg-surface)',
                border: `1px solid ${selectedPatternKey === key ? 'var(--primary)' : 'var(--border-subtle)'}`,
                color: selectedPatternKey === key ? 'var(--primary-dark)' : 'var(--text-secondary)',
                padding: '10px 22px',
                borderRadius: '100px',
                fontSize: '0.88rem',
                fontWeight: 600,
                transition: 'all 0.25s ease'
              }}
            >
              {pat.name}
            </button>
          ))}
        </div>

        {/* Breathing 3D Guide Display */}
        <div className="glass-card" style={{ padding: '36px 24px', marginBottom: '32px', position: 'relative' }}>
          {/* Phase Badge */}
          <div style={{
            display: 'inline-block',
            fontSize: '1.4rem',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800,
            color: currentPhase.name === 'Inhale' ? '#2d6a4f' : currentPhase.name === 'Hold' ? '#b07d3b' : '#2b5f7d',
            marginBottom: '4px'
          }}>
            {isRunning ? currentPhase.name.toUpperCase() : 'READY TO BEGIN'}
          </div>

          <div style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
            {isRunning ? `${secondsRemaining}s` : `${pattern.phases[0].duration}s`}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', minHeight: '24px', marginBottom: '24px' }}>
            {isRunning ? currentPhase.tip : pattern.description}
          </p>

          {/* 3D Living Inner World Breathing Canopy Mount */}
          <div style={{ width: '340px', height: '340px', margin: '0 auto', position: 'relative' }}>
            <InnerWorldCanvas
              mode="breathing"
              breathingPhase={isRunning ? currentPhase.name : null}
              breathingDuration={currentPhase.duration}
              rippleTrigger={completedCycles}
              growthLevel={0.65}
            />
          </div>

          {/* Cycles Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div>Completed Cycles: <strong style={{ color: 'var(--text-primary)' }}>{completedCycles}</strong></div>
            <div>Sound Cue: <strong style={{ color: soundEnabled ? 'var(--primary-dark)' : 'var(--text-muted)' }}>{soundEnabled ? 'Enabled' : 'Muted'}</strong></div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={handleStartStop}
            className="btn-primary"
            style={{ minWidth: '180px', padding: '14px 36px', fontSize: '1.05rem' }}
          >
            {isRunning ? 'Pause Sanctuary ⏸' : 'Start Session ▶'}
          </button>

          <button
            onClick={handleReset}
            className="btn-ghost"
            style={{ padding: '14px 24px' }}
          >
            ↺ Reset
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="btn-ghost"
            style={{ padding: '14px 24px' }}
            title={soundEnabled ? 'Mute singing chime' : 'Enable singing chime'}
          >
            {soundEnabled ? '🔔 Chimes On' : '🔕 Chimes Off'}
          </button>
        </div>
      </div>
    </div>
  );
}
