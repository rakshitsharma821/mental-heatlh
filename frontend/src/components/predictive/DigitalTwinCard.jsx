import React from 'react';

export default function DigitalTwinCard({ twin }) {
  if (!twin) return null;

  const { metrics, patterns, dataVolume } = twin;

  const getStressColor = (val) => {
    if (val < 40) return '#40916c'; // calm green
    if (val < 65) return '#52b788'; // sprout mint
    return '#d4a373'; // gentle warm sand amber
  };

  const getResilienceColor = (val) => {
    if (val > 65) return '#2d6a4f'; // resilient evergreen
    if (val > 40) return '#52b788';
    return '#72a1bf';
  };

  return (
    <div className="glass-card" style={{ marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>🔮</span>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Digital Twin • Wellness Equilibrium Profile</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
            A private, evolving mathematical model of your autonomic and emotional patterns
          </p>
        </div>

        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          background: 'rgba(82, 183, 136, 0.1)',
          border: '1px solid rgba(82, 183, 136, 0.22)',
          padding: '4px 12px',
          borderRadius: '100px'
        }}>
          Informed by {dataVolume.totalMoods} check-ins • {dataVolume.totalJournals} reflections
        </div>
      </div>

      {/* Core Indices Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
        {/* Stress Index */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '18px', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
              Stress Load Index
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: getStressColor(metrics.stressIndex) }}>
              {metrics.stressIndex} / 100
            </span>
          </div>
          <div style={{ height: '6px', background: 'rgba(33, 64, 47, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${metrics.stressIndex}%`,
              height: '100%',
              background: getStressColor(metrics.stressIndex),
              borderRadius: '10px',
              transition: 'width 0.6s ease'
            }} />
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            {metrics.stressIndex < 40 ? 'Calm & regulated state' : metrics.stressIndex < 65 ? 'Moderate cognitive load' : 'Elevated tension detected'}
          </p>
        </div>

        {/* Resilience Capacity */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '18px', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
              Resilience Buffer
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: getResilienceColor(metrics.resilienceCapacity) }}>
              {metrics.resilienceCapacity} / 100
            </span>
          </div>
          <div style={{ height: '6px', background: 'rgba(33, 64, 47, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${metrics.resilienceCapacity}%`,
              height: '100%',
              background: getResilienceColor(metrics.resilienceCapacity),
              borderRadius: '10px',
              transition: 'width 0.6s ease'
            }} />
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Capacity to absorb daily stressors
          </p>
        </div>

        {/* Habit Consistency */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '18px', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
              Habit Momentum
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
              {metrics.habitConsistency}%
            </span>
          </div>
          <div style={{ height: '6px', background: 'rgba(33, 64, 47, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${metrics.habitConsistency}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
              borderRadius: '10px',
              transition: 'width 0.6s ease'
            }} />
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Consistency across self-care routines
          </p>
        </div>

        {/* Emotional Velocity */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '18px', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
              Valence Velocity
            </span>
            <span style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: metrics.emotionalVelocity > 0 ? '#40916c' : metrics.emotionalVelocity < -0.15 ? '#d4a373' : 'var(--primary)'
            }}>
              {metrics.emotionalVelocity > 0 ? `+${metrics.emotionalVelocity}` : metrics.emotionalVelocity}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
            {metrics.emotionalVelocity > 0.15 ? '↗ Uplifting Trajectory' : metrics.emotionalVelocity < -0.15 ? '↘ Energy Conservation' : '→ Steady Grounding'}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            7-day rolling regression slope
          </p>
        </div>
      </div>
    </div>
  );
}
