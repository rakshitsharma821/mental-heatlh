import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Storage } from '../../services/storage';

export default function EarlyWarningNudge({ warning, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  if (!warning || !warning.active || dismissed) return null;

  const handleSnooze = () => {
    setDismissed(true);
    const twin = Storage.getDigitalTwin();
    if (twin && twin.earlyWarning) {
      twin.earlyWarning.active = false;
      twin.earlyWarning.lastDismissedAt = new Date().toISOString();
      Storage.saveDigitalTwin(twin);
    }
    if (onDismiss) onDismiss();
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(246, 189, 96, 0.16), rgba(241, 245, 238, 0.96))',
      border: '1px solid rgba(212, 163, 115, 0.35)',
      borderRadius: '22px',
      padding: '24px 28px',
      marginBottom: '32px',
      position: 'relative',
      boxShadow: '0 8px 30px rgba(33, 64, 47, 0.08)',
      animation: 'slideUpFade 0.4s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.6rem' }}>🌿</span>
          <div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: '#b07d3b'
            }}>
              Preventive Sanctuary Nudge
            </span>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginTop: '2px' }}>
              {warning.title}
            </h3>
          </div>
        </div>

        <button
          onClick={handleSnooze}
          className="btn-ghost"
          style={{ padding: '6px 14px', fontSize: '0.75rem', borderColor: 'rgba(212, 163, 115, 0.35)', color: '#b07d3b' }}
          title="Pause nudge for 48 hours"
        >
          Snooze Nudge (48h) ✕
        </button>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '16px' }}>
        {warning.gentleMessage}
      </p>

      {/* Corroborating reasons badge */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        border: '1px solid rgba(212, 163, 115, 0.25)',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b07d3b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
          Observed Multi-Signal Correlations:
        </div>
        <ul style={{ paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {warning.corroboratingReasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link
          to={warning.nudgeAction}
          className="btn-primary"
          style={{
            padding: '10px 22px',
            fontSize: '0.88rem'
          }}
        >
          {warning.nudgeActionLabel}
        </Link>
        <Link
          to="/crisis"
          style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'underline' }}
        >
          Need urgent human support? Open Crisis Lifelines 🛡️
        </Link>
      </div>
    </div>
  );
}
