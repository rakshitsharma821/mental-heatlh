import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Storage } from '../services/storage';
import { generateTherapyRoadmap } from '../services/roadmapEngine';
import { Link } from 'react-router-dom';
import GeometricShapesCanvas from '../components/three/GeometricShapesCanvas';

export default function Roadmap() {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState(null);

  useEffect(() => {
    const journals = Storage.getJournalEntries();
    const data = generateTherapyRoadmap(user, journals);
    setRoadmap(data);
  }, [user]);

  if (!roadmap) return null;

  return (
    <div className="roadmap-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh' }}>
      <GeometricShapesCanvas />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--primary-dark)', fontWeight: 700 }}>
            Personalized Clinical Pathway
          </span>
          <h1 style={{ fontSize: '2.4rem', marginTop: '6px', marginBottom: '8px', color: 'var(--text-primary)' }}>Personalized Therapy Roadmap</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            A tailored sequence of cognitive, somatic, and behavioral exercises generated from your emotional rhythm.
          </p>
        </div>

        {/* Primary Pathway Banner */}
        <div className="glass-card" style={{
          padding: '28px',
          marginBottom: '36px',
          borderLeft: `4px solid ${roadmap.trackColor}`
        }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--primary-dark)', fontWeight: 700 }}>
            Active Tailored Track
          </span>
          <h2 style={{ fontSize: '1.6rem', marginTop: '4px', marginBottom: '8px', color: 'var(--text-primary)' }}>
            {roadmap.primaryTrack}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '16px' }}>
            {roadmap.trackDescription}
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {roadmap.tailoredTips.map((tip, i) => (
              <span
                key={i}
                style={{
                  background: 'rgba(82, 183, 136, 0.12)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '100px',
                  padding: '5px 14px',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)'
                }}
              >
                ✦ {tip}
              </span>
            ))}
          </div>
        </div>

        {/* Progression Milestones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {roadmap.milestones.map((m, idx) => (
            <div
              key={m.id}
              className="glass-card"
              style={{
                padding: '24px',
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start',
                opacity: m.status === 'locked' ? 0.5 : 1
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: m.status === 'completed' ? 'rgba(82, 183, 136, 0.18)' : 'rgba(82, 183, 136, 0.08)',
                border: `1px solid ${m.status === 'completed' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                flexShrink: 0
              }}>
                {m.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary-dark)', fontWeight: 700 }}>
                    {m.stage} • {m.duration}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '100px',
                    background: m.status === 'completed' ? 'rgba(82, 183, 136, 0.2)' : 'rgba(82, 121, 111, 0.1)',
                    color: m.status === 'completed' ? 'var(--primary-dark)' : 'var(--text-muted)'
                  }}>
                    {m.status.toUpperCase()}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '6px' }}>{m.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '14px' }}>{m.description}</p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Clinical Protocol: {m.cbtTechnique}
                  </span>
                  {m.route && (
                    <Link to={m.route} className="btn-primary" style={{ padding: '6px 18px', fontSize: '0.8rem' }}>
                      Practice Step →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
