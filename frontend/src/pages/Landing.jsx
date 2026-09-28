// ============================================
// MindCare Sanctuary — Landing Page (Light Botanical 3D Theme)
// Real Three.js Inner World Hero, Bespoke SVG Feature Cards,
// Dynamic Visual Rhythm, and Interactive Evolution Showcase
// ============================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import InnerWorldCanvas from '../components/three/InnerWorldCanvas';
import AmbientCanvas from '../components/three/AmbientCanvas';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();
  const [previewStage, setPreviewStage] = useState(0.7);

  const STAGES = [
    { level: 0.25, name: 'Stage 1: The Sprout', desc: 'Your first breathwork and mood reflections take root.' },
    { level: 0.6, name: 'Stage 2: Branching Stillness', desc: 'Consistent routines build emotional resilience and foliage.' },
    { level: 0.95, name: 'Stage 3: Flourishing Haven', desc: 'A deeply grounded inner world radiating warmth and balance.' }
  ];

  return (
    <div className="landing-page" style={{ position: 'relative', overflow: 'hidden', paddingBottom: '90px' }}>
      <AmbientCanvas count={28} speed={0.25} />

      {/* Hero Section */}
      <section className="hero-section" style={{
        minHeight: '88vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 24px 30px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          alignItems: 'center',
          gap: '50px'
        }}>
          {/* Text Side */}
          <div style={{ zIndex: 2 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 18px',
              background: 'rgba(82, 183, 136, 0.12)',
              border: '1px solid rgba(82, 183, 136, 0.28)',
              borderRadius: '100px',
              fontSize: '0.84rem',
              fontWeight: '600',
              color: 'var(--accent-forest)',
              marginBottom: '24px'
            }}>
              <span style={{ color: 'var(--accent-leaf)' }}>✦</span> Confidential Mental Wellness Sanctuary
            </div>

            <h1 style={{
              fontSize: 'clamp(2.6rem, 5.2vw, 4.2rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '24px',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #1a2e22 20%, #2d6a4f 65%, #40916c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Heal slowly.<br />Rise stronger.
            </h1>

            <p style={{
              fontSize: '1.12rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.75,
              marginBottom: '36px',
              maxWidth: '520px'
            }}>
              An unhurried space for mindful breathwork, emotional rhythm tracking, and gentle cognitive reflection. All data stays protected with field-level encryption.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <Link to={user ? "/dashboard" : "/register"} className="btn-primary" style={{ padding: '14px 34px', fontSize: '0.98rem' }}>
                {user ? "Open Your Dashboard →" : "Enter Sanctuary →"}
              </Link>
              <Link to="/breathing" className="btn-ghost" style={{ padding: '14px 28px', fontSize: '0.98rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                </svg>
                <span>3D Breathwork</span>
              </Link>
            </div>

            {/* Privacy Promise note */}
            <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-forest)' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Zero tracking • No ads • Client-sovereign encryption</span>
            </div>
          </div>

          {/* Genuine 3D Living Inner World Sanctuary Tree */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '480px',
            width: '100%'
          }}>
            <InnerWorldCanvas mode="hero" growthLevel={previewStage} />
          </div>
        </div>
      </section>

      {/* Feature Pillars with Bespoke SVG Badges & Depth */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--accent-forest)', fontWeight: 700 }}>
            Sanctuary Core
          </span>
          <h2 style={{ fontSize: '2.4rem', marginTop: '10px', color: 'var(--text-primary)', fontWeight: 800 }}>Gentle tools for daily renewal</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '12px auto 0', fontSize: '1.02rem', lineHeight: 1.6 }}>
            Designed around physiological nervous system down-regulation, compassionate reflection, and clinical autonomy.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '26px'
        }}>
          {/* Card 1: 3D Breathwork */}
          <div className="glass-card feature-hover-card">
            <div className="feature-icon-badge">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-primary)', fontWeight: 700 }}>3D Guided Breathwork</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
              A living visual breathing guide that expands and contracts with your natural respiratory cycles, tuned to soothing harmonic resonance.
            </p>
            <Link to="/breathing" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', color: 'var(--accent-forest)', fontWeight: 600, fontSize: '0.86rem', textDecoration: 'none' }}>
              Begin Session <span>→</span>
            </Link>
          </div>

          {/* Card 2: AI Companion */}
          <div className="glass-card feature-hover-card">
            <div className="feature-icon-badge">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                <path d="M12 6a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 12 6zm-2 5h4v5h-4z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-primary)', fontWeight: 700 }}>AI Companion & Insights</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
              Meet Aria, your memory-enabled wellness companion who respects your privacy boundaries and provides transparent, data-backed observations.
            </p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', color: 'var(--accent-forest)', fontWeight: 600, fontSize: '0.86rem' }}>
              Available 24/7 in Bottom Corner <span>✦</span>
            </span>
          </div>

          {/* Card 3: Encrypted Journal */}
          <div className="glass-card feature-hover-card">
            <div className="feature-icon-badge">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-primary)', fontWeight: 700 }}>Encrypted Reflective Journal</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
              A sanctuary for expressive thought defusion. Entries are protected with AES-256-GCM authenticated encryption at rest.
            </p>
            <Link to="/journal" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', color: 'var(--accent-forest)', fontWeight: 600, fontSize: '0.86rem', textDecoration: 'none' }}>
              Write Entry <span>→</span>
            </Link>
          </div>

          {/* Card 4: Crisis Support */}
          <div className="glass-card feature-hover-card">
            <div className="feature-icon-badge crisis-badge">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-primary)', fontWeight: 700 }}>Crisis Support & Safety</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
              Zero-barrier emergency helplines and an interactive 5-step digital safety plan that functions independently of all other systems.
            </p>
            <Link to="/crisis" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', color: '#a84b33', fontWeight: 700, fontSize: '0.86rem', textDecoration: 'none' }}>
              Safety Lifeline <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Secondary Section: Inner World Evolution Preview */}
      <section style={{ maxWidth: '1200px', margin: '40px auto 20px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 247, 242, 0.85))',
          border: '1px solid rgba(82, 183, 136, 0.25)',
          borderRadius: '24px',
          padding: '44px 36px',
          boxShadow: '0 16px 40px rgba(45, 106, 79, 0.06)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '36px', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '2.5px', color: 'var(--accent-forest)', fontWeight: 700 }}>
                Living Digital Twin
              </span>
              <h3 style={{ fontSize: '2rem', marginTop: '8px', marginBottom: '14px', color: 'var(--text-primary)', fontWeight: 800 }}>
                A 3D Sanctuary That Grows With You
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.7, marginBottom: '24px' }}>
                Your Inner World tree is not a static graphic — it evolves organically as you log mood check-ins, complete breathing exercises, and maintain wellness habits.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {STAGES.map(s => (
                  <div 
                    key={s.level} 
                    onClick={() => setPreviewStage(s.level)}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '12px',
                      background: previewStage === s.level ? 'rgba(82, 183, 136, 0.16)' : 'rgba(255, 255, 255, 0.6)',
                      border: `1px solid ${previewStage === s.level ? 'var(--accent-leaf)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--accent-forest)' }}>{s.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', background: 'rgba(240, 247, 242, 0.5)', borderRadius: '20px', padding: '30px' }}>
              <div style={{ fontStyle: 'italic', fontSize: '1.25rem', color: 'var(--accent-forest)', lineHeight: 1.6, marginBottom: '16px', fontFamily: 'serif' }}>
                "In the middle of movement and chaos, keep stillness inside of you."
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Deepak Chopra
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
