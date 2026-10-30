import React, { useState, useEffect } from 'react';
import { CRISIS_HELPLINES, GROUNDING_54321 } from '../services/safetyPlan';
import { Storage } from '../services/storage';

export default function CrisisSupport() {
  const [safetyPlan, setSafetyPlan] = useState({
    warningSigns: '',
    copingStrategies: '',
    safePlaces: '',
    supportContacts: '',
    professionalSupport: 'National Suicide & Crisis Lifeline: 988\nCrisis Text Line: Text HOME to 741741\nEmergency Services: 911 / 112',
    environmentSafety: ''
  });
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    const loaded = Storage.getSafetyPlan();
    if (loaded) {
      setSafetyPlan(loaded);
    }
  }, []);

  const handlePlanChange = (field, val) => {
    const updated = { ...safetyPlan, [field]: val };
    setSafetyPlan(updated);
    Storage.saveSafetyPlan(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="crisis-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '940px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Urgent Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.1), rgba(255, 245, 245, 0.95))',
          border: '1px solid rgba(220, 53, 69, 0.28)',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '36px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(220, 53, 69, 0.06)'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(220, 53, 69, 0.12)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          </div>
          <h1 style={{ fontSize: '2.2rem', color: '#991b1b', marginBottom: '10px' }}>Immediate Crisis Support</h1>
          <p style={{ color: '#7f1d1d', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto', lineHeight: 1.6 }}>
            If you are in danger, feeling overwhelmed, or experiencing thoughts of self-harm, please know you are not alone. Compassionate human help is ready for you right now — free, confidential, and 24/7.
          </p>
        </div>

        {/* 24/7 Crisis Helplines Directory */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '18px', color: 'var(--text-primary)' }}>24/7 Emergency Helplines & Lifelines</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {CRISIS_HELPLINES.map((h, idx) => (
              <div
                key={idx}
                className="glass-card"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: '4px solid #dc2626'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>{h.flag}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{h.country}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{h.service}</h3>
                  <div style={{ marginBottom: '6px' }}>
                    <a
                      href={h.callUrl}
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        color: '#b91c1c',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title={`Call ${h.service} directly`}
                    >
                      {h.number}
                    </a>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{h.availability}</p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <a
                    href={h.callUrl}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      fontSize: '0.88rem',
                      background: 'linear-gradient(135deg, #b91c1c, #dc2626)',
                      color: '#ffffff',
                      boxShadow: '0 4px 15px rgba(220, 38, 38, 0.25)'
                    }}
                  >
                    Call / Connect Now 
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Somatic 5-4-3-2-1 Grounding Tool */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-sage-soft, #eaf4ee)', color: 'var(--accent-forest, #245741)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            </div>
            <h2 style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>5-4-3-2-1 Sensory Grounding Technique</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
            When feelings spike into panic or dissociative overwhelm, walk through these 5 physical anchors to ground yourself back in the room:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {GROUNDING_54321.map((item, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(82, 183, 136, 0.2)',
                  color: 'var(--primary-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  flexShrink: 0
                }}>
                  {5 - i}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.98rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{item.step}</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5-Step Digital Safety Plan */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem' }}>Personal Digital Safety Plan</h2>
              <p style={{ color: '#8aa9c4', fontSize: '0.85rem' }}>
                A step-by-step coping toolkit saved locally on your device for moments when thinking clearly feels impossible.
              </p>
            </div>
            {savedNotice && (
              <span style={{ fontSize: '0.78rem', color: '#88d8b0', fontWeight: 600 }}>
                 Safety plan saved locally
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="input-group">
              <label className="input-label">Step 1: Warning Signs (Thoughts, images, feelings that a crisis is developing)</label>
              <textarea
                className="input-field"
                rows="2"
                placeholder="e.g. Skipping sleep, pacing, racing catastrophic thoughts, withdrawing from friends"
                value={safetyPlan.warningSigns}
                onChange={(e) => handlePlanChange('warningSigns', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Step 2: Internal Coping Strategies (Things I can do on my own to take my mind off problems)</label>
              <textarea
                className="input-field"
                rows="2"
                placeholder="e.g. 4-7-8 breathing session on MindCare, taking a cold splash of water, walking the dog"
                value={safetyPlan.copingStrategies}
                onChange={(e) => handlePlanChange('copingStrategies', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Step 3: People and Social Settings that Provide Distraction</label>
              <textarea
                className="input-field"
                rows="2"
                placeholder="e.g. Sitting in a quiet bookstore or park, calling Maya to talk about music"
                value={safetyPlan.safePlaces}
                onChange={(e) => handlePlanChange('safePlaces', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Step 4: People I can ask for help</label>
              <textarea
                className="input-field"
                rows="2"
                placeholder="e.g. Brother (555-0192), Counselor Sarah (555-0144)"
                value={safetyPlan.supportContacts}
                onChange={(e) => handlePlanChange('supportContacts', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Step 5: Making the Environment Safe</label>
              <textarea
                className="input-field"
                rows="2"
                placeholder="e.g. Giving medication bottles to a trusted roommate, putting phone away during late night distress"
                value={safetyPlan.environmentSafety}
                onChange={(e) => handlePlanChange('environmentSafety', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
