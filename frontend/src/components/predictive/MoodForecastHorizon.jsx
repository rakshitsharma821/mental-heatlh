import React from 'react';
import { Link } from 'react-router-dom';

export default function MoodForecastHorizon({ forecast }) {
  if (!forecast) return null;

  const { direction, confidence, summary, signals, recommendation } = forecast;

  const getDirectionBadge = () => {
    switch (direction) {
      case 'gentle_rise':
        return { label: 'Uplifting Momentum ↗', color: '#2d6a4f', bg: 'rgba(82, 183, 136, 0.2)' };
      case 'gentle_dip':
        return { label: 'Gentle Energy Conservation ↘', color: '#b07d3b', bg: 'rgba(246, 189, 96, 0.25)' };
      case 'building_baseline':
        return { label: 'Building Baseline ⋯', color: '#52796f', bg: 'rgba(82, 121, 111, 0.15)' };
      default:
        return { label: 'Steady Sanctuary Anchor →', color: '#2d6a4f', bg: 'rgba(82, 183, 136, 0.18)' };
    }
  };

  const badge = getDirectionBadge();

  return (
    <div className="glass-card" style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem', color: 'var(--primary)' }}></span>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>AI Mood Prediction • Emotional Horizon</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
            Predictive rhythm modeling based on your recent valence, timing, and routine data
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '5px 14px',
            borderRadius: '100px',
            color: badge.color,
            background: badge.bg,
            border: `1px solid ${badge.color}40`
          }}>
            {badge.label}
          </span>
          <span style={{
            fontSize: '0.72rem',
            color: 'var(--text-secondary)',
            background: 'rgba(82, 183, 136, 0.1)',
            padding: '5px 10px',
            borderRadius: '100px',
            border: '1px solid var(--border-subtle)'
          }}>
            Confidence: {confidence.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Forecast Summary Card */}
      <div style={{
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '18px',
        padding: '22px',
        marginBottom: '18px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
          {summary}
        </div>

        {/* Explainable Signals List */}
        <div style={{
          background: 'rgba(82, 183, 136, 0.06)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            Underlying Predictive Signals:
          </div>
          <ul style={{ paddingLeft: '18px', fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {signals.map((sig, i) => (
              <li key={i}>{sig}</li>
            ))}
          </ul>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.88rem', color: 'var(--primary-dark)' }}>
            <strong>Suggested Nurture:</strong> {recommendation}
          </div>
          <Link to="/breathing" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.82rem' }}>
            3-Min Breathwork 
          </Link>
        </div>
      </div>
    </div>
  );
}
