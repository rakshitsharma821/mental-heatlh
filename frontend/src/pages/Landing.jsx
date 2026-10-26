// ============================================
// MindCare Sanctuary — Redesigned Light-Theme Landing Page
// Featuring:
// 1. Calm 3D Brain Hero (Dual hemispheres, cerebellum, stem, domain-warped gyri, thought pulses)
// 2. 9s Autonomic Breathing Cycle with synchronized pacing caption
// 3. Responsive Hero Layout:
//    - Desktop (1440px): Headline & CTAs on left, 3D Brain on right
//    - Mobile (390px): 3D Brain positioned above headline, sized gracefully without clipping
// 4. Interactive Story: How It Works, 4 Sanctuary Pillars in 3D-tilt cards, Verified Clinicians, Zero-Trust Architecture
// 5. High-contrast typography (Inter & Outfit), WCAG AA compliance, pure SVG icons (Zero emoji icons)
// ============================================

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TiltCard from '../components/common/TiltCard';
import { theme } from '../styles/theme';
import { UI_STRINGS } from '../config/strings';

// Lazy-load the Three.js Calm Brain Hero
const CalmBrainHero = React.lazy(() => import('../components/three/CalmBrainHero'));

export default function Landing() {
  const { user } = useAuth();

  // Scroll reveal observer
  const [revealedSections, setRevealedSections] = useState({
    steps: false,
    features: false,
    sessionFlow: false,
    privacy: false
  });

  const stepsRef = useRef(null);
  const featuresRef = useRef(null);
  const sessionFlowRef = useRef(null);
  const privacyRef = useRef(null);

  useEffect(() => {
    // Scroll reveal observer for story sections
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionKey = entry.target.getAttribute('data-section');
          if (sectionKey) {
            setRevealedSections(prev => ({ ...prev, [sectionKey]: true }));
          }
        }
      });
    }, { threshold: 0.15 });

    if (stepsRef.current) observer.observe(stepsRef.current);
    if (featuresRef.current) observer.observe(featuresRef.current);
    if (sessionFlowRef.current) observer.observe(sessionFlowRef.current);
    if (privacyRef.current) observer.observe(privacyRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="landing-page" style={{ position: 'relative', overflowX: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
      {/* ── 1. HERO SECTION (CALM 3D BRAIN + CONFIDENT TYPOGRAPHY) ── */}
      <section className="hero-section" style={{
        minHeight: '88vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '54px 24px 36px',
        position: 'relative',
        background: 'radial-gradient(ellipse at 70% 30%, rgba(116, 198, 157, 0.18) 0%, rgba(157, 132, 183, 0.14) 35%, rgba(250, 249, 245, 0.96) 75%)'
      }}>
        <div className="hero-grid-container">
          {/* Hero Left / Bottom on mobile: Big confident typography & CTAs */}
          <div className="hero-text-col">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 18px',
              background: 'var(--accent-sage-soft)',
              border: '1px solid rgba(82, 183, 136, 0.3)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--accent-forest)',
              marginBottom: '24px'
            }}>
              <svg width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-0.15em', flexShrink: 0, color: 'var(--accent-leaf)' }}>
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
              </svg>
              <span>{UI_STRINGS.hero?.badge || 'Confidential Mental Wellness Sanctuary'}</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.6rem, 5.2vw, 4.2rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '22px',
              letterSpacing: '-0.025em',
              color: 'var(--text-primary)'
            }}>
              {UI_STRINGS.hero?.titleLine1 || 'Heal slowly.'}<br />
              <span style={{
                background: 'linear-gradient(135deg, var(--accent-forest) 10%, var(--accent-leaf) 55%, var(--accent-mint) 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {UI_STRINGS.hero?.titleLine2 || 'Rise stronger.'}
              </span>
            </h1>

            <p style={{
              fontSize: '1.12rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.75,
              marginBottom: '34px',
              maxWidth: '520px'
            }}>
              {UI_STRINGS.hero?.subtext || 'An unhurried space for mindful breathwork, emotional rhythm tracking, and gentle cognitive reflection. Free of judgment, ads, and surveillance.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <Link
                to={user ? "/dashboard" : "/register"}
                className="btn-primary"
                style={{ padding: '15px 34px', fontSize: '1rem' }}
              >
                {user ? (UI_STRINGS.hero?.ctaDashboard || 'Open Your Dashboard →') : (UI_STRINGS.hero?.ctaRegister || 'Begin Sanctuary Journey →')}
              </Link>
              <Link
                to="/breathing"
                className="btn-ghost"
                style={{ padding: '14px 28px', fontSize: '0.98rem' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                </svg>
                <span>{UI_STRINGS.hero?.ctaBreathing || '3D Breathwork'}</span>
              </Link>
            </div>

            {/* Privacy Guarantee Note */}
            <div style={{ marginTop: '34px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-forest)', flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>{UI_STRINGS.hero?.privacyNote || 'Zero ad tracking • AES-256 Encrypted Journals • DPDP Compliant'}</span>
            </div>
          </div>

          {/* Hero Right / Top on mobile: Calm 3D Brain Hero */}
          <div className="hero-brain-col">
            <Suspense fallback={
              <div style={{ width: '100%', height: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loader-spinner" />
              </div>
            }>
              <CalmBrainHero />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── 2. SCROLL STORY: HOW IT WORKS (ANIMATED CONNECTORS) ── */}
      <section
        ref={stepsRef}
        data-section="steps"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '70px 24px 60px',
          opacity: revealedSections.steps ? 1 : 0.2,
          transform: revealedSections.steps ? 'translateY(0)' : 'translateY(32px)',
          transition: 'all 0.8s cubic-bezier(0.2, 0, 0.2, 1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--accent-forest)', fontWeight: 700 }}>
            {UI_STRINGS.landing?.flowBadge || 'Mindful Flow'}
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 3.8vw, 2.8rem)', marginTop: '8px', color: 'var(--text-primary)', fontWeight: 800 }}>
            {UI_STRINGS.landing?.flowTitle || 'How MindCare Works'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '12px auto 0', fontSize: '1.02rem', lineHeight: 1.6 }}>
            {UI_STRINGS.landing?.flowSubtitle || 'A calm, 3-step rhythm designed to meet young adults wherever they are today.'}
          </p>
        </div>

        {/* 3 Step Cards with Animated Connector Lines */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '30px',
          position: 'relative'
        }}>
          {/* Step 1 */}
          <TiltCard style={{ height: '100%' }}>
            <div className="glass-card" style={{
              height: '100%',
              padding: '36px 30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: 'var(--radius-lg)'
            }}>
              <div>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'var(--accent-sage-soft)',
                  color: 'var(--accent-forest)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  01
                </div>
                <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                  {UI_STRINGS.landing?.step1Title || '2-Minute Self-Reflection'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                  {UI_STRINGS.landing?.step1Desc || 'Answer a fixed, non-clinical 8-question pulse. MindCare tunes your recommended breathing patterns, focus games, and soothing soundscapes without diagnostic labels.'}
                </p>
              </div>
              <div style={{ marginTop: '24px', fontSize: '0.84rem', fontWeight: 600, color: 'var(--accent-forest)' }}>
                {UI_STRINGS.landing?.step1Footer || 'Step 1 of Sanctuary Flow →'}
              </div>
            </div>
          </TiltCard>

          {/* Step 2 */}
          <TiltCard style={{ height: '100%' }}>
            <div className="glass-card" style={{
              height: '100%',
              padding: '36px 30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: 'var(--radius-lg)',
              borderTop: '3px solid var(--accent-lavender)'
            }}>
              <div>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'var(--accent-lavender-soft)',
                  color: 'var(--accent-lavender-dark)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  02
                </div>
                <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                  {UI_STRINGS.landing?.step2Title || 'Tailored Daily Rhythms'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                  {UI_STRINGS.landing?.step2Desc || 'Engage in 3D pacing breathwork, tactile Zen gardening, and encrypted reflective journaling. Your digital twin gently responds to every mindful pause.'}
                </p>
              </div>
              <div style={{ marginTop: '24px', fontSize: '0.84rem', fontWeight: 600, color: 'var(--accent-lavender-dark)' }}>
                {UI_STRINGS.landing?.step2Footer || 'Step 2 of Sanctuary Flow →'}
              </div>
            </div>
          </TiltCard>

          {/* Step 3 */}
          <TiltCard style={{ height: '100%' }}>
            <div className="glass-card" style={{
              height: '100%',
              padding: '36px 30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: 'var(--radius-lg)',
              borderTop: '3px solid var(--accent-peach)'
            }}>
              <div>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'var(--accent-peach-soft)',
                  color: 'var(--accent-peach-dark)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  03
                </div>
                <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                  {UI_STRINGS.landing?.step3Title || 'Companion & Clinical Care'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                  {UI_STRINGS.landing?.step3Desc || 'Talk with Aria, our non-judgmental AI companion, or request a 1-on-1 consultation with verified psychologists and psychiatrists whenever deeper human support is needed.'}
                </p>
              </div>
              <div style={{ marginTop: '24px', fontSize: '0.84rem', fontWeight: 600, color: 'var(--accent-peach-dark)' }}>
                {UI_STRINGS.landing?.step3Footer || 'Step 3 of Sanctuary Flow →'}
              </div>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ── 3. SANCTUARY CORE PILLARS (3D TILT CARDS) ── */}
      <section
        ref={featuresRef}
        data-section="features"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '60px 24px',
          opacity: revealedSections.features ? 1 : 0.2,
          transform: revealedSections.features ? 'translateY(0)' : 'translateY(32px)',
          transition: 'all 0.8s cubic-bezier(0.2, 0, 0.2, 1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--accent-forest)', fontWeight: 700 }}>
            {UI_STRINGS.landing?.coreBadge || 'Sanctuary Core'}
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 3.8vw, 2.8rem)', marginTop: '8px', color: 'var(--text-primary)', fontWeight: 800 }}>
            {UI_STRINGS.landing?.coreTitle || 'Gentle Tools for Daily Renewal'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '12px auto 0', fontSize: '1.02rem', lineHeight: 1.6 }}>
            {UI_STRINGS.landing?.coreSubtitle || 'Designed around physiological nervous system down-regulation, compassionate reflection, and clinical autonomy.'}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '26px'
        }}>
          {/* Pillar 1 */}
          <TiltCard>
            <div className="glass-card feature-hover-card" style={{ height: '100%' }}>
              <div className="feature-icon-badge">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-primary)', fontWeight: 700 }}>
                {UI_STRINGS.landing?.pillar1Title || '3D Guided Breathwork'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {UI_STRINGS.landing?.pillar1Desc || 'A calming procedural brain and responsive rhythm orb that expands and contracts with your natural respiratory cycles.'}
              </p>
              <Link to="/breathing" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '18px', color: 'var(--accent-forest)', fontWeight: 600, fontSize: '0.88rem' }}>
                <span>{UI_STRINGS.landing?.pillar1Cta || 'Begin Breathwork →'}</span>
              </Link>
            </div>
          </TiltCard>

          {/* Pillar 2 */}
          <TiltCard>
            <div className="glass-card feature-hover-card" style={{ height: '100%' }}>
              <div className="feature-icon-badge" style={{ background: 'var(--accent-lavender-soft)', color: 'var(--accent-lavender-dark)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-primary)', fontWeight: 700 }}>
                {UI_STRINGS.landing?.pillar2Title || 'Aria Care Companion'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {UI_STRINGS.landing?.pillar2Desc || 'A warm, grounded wellness friend governed by strict safe-language rules. Aria never diagnoses, never echoes negative triggers, and offers calm guidance.'}
              </p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '18px', color: 'var(--accent-lavender-dark)', fontWeight: 600, fontSize: '0.88rem' }}>
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                </svg>
                <span>{UI_STRINGS.landing?.pillar2Badge || 'Always Available in Corner'}</span>
              </span>
            </div>
          </TiltCard>

          {/* Pillar 3 */}
          <TiltCard>
            <div className="glass-card feature-hover-card" style={{ height: '100%' }}>
              <div className="feature-icon-badge" style={{ background: 'var(--accent-peach-soft)', color: 'var(--accent-peach-dark)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-primary)', fontWeight: 700 }}>
                {UI_STRINGS.landing?.pillar3Title || 'Encrypted Journal'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {UI_STRINGS.landing?.pillar3Desc || 'A private shelter for unfiltered reflection. Thought logs are defended with authenticated AES-256-GCM encryption before storage.'}
              </p>
              <Link to="/journal" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '18px', color: 'var(--accent-peach-dark)', fontWeight: 600, fontSize: '0.88rem' }}>
                <span>{UI_STRINGS.landing?.pillar3Cta || 'Open Private Journal →'}</span>
              </Link>
            </div>
          </TiltCard>

          {/* Pillar 4 */}
          <TiltCard>
            <div className="glass-card feature-hover-card" style={{ height: '100%' }}>
              <div className="feature-icon-badge crisis-badge">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-primary)', fontWeight: 700 }}>
                {UI_STRINGS.landing?.pillar4Title || 'Crisis Lifeline & Safety Plan'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {UI_STRINGS.landing?.pillar4Desc || 'Zero-barrier emergency helplines (Tele-MANAS 14416, KIRAN) and an interactive 5-step digital safety plan that functions independently of all other systems.'}
              </p>
              <Link to="/crisis" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '18px', color: 'var(--color-error-text)', fontWeight: 700, fontSize: '0.88rem' }}>
                <span>{UI_STRINGS.landing?.pillar4Cta || 'Immediate Lifeline →'}</span>
              </Link>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ── 4. HOW A SESSION HAPPENS (HONEST, DATA-FREE SESSION LIFECYCLE) ── */}
      <section
        id="session-flow-section"
        ref={sessionFlowRef}
        data-section="sessionFlow"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '60px 24px',
          opacity: revealedSections.sessionFlow ? 1 : 0.2,
          transform: revealedSections.sessionFlow ? 'translateY(0)' : 'translateY(32px)',
          transition: 'all 0.8s cubic-bezier(0.2, 0, 0.2, 1)'
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(246, 248, 244, 0.92))',
          borderRadius: 'var(--radius-xl)',
          padding: '54px 40px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Section Header */}
          <div style={{ maxWidth: '680px', marginBottom: '46px' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2.5px', color: 'var(--accent-forest)', fontWeight: 700 }}>
              {UI_STRINGS.sessionFlow?.heading || 'How a session happens'}
            </span>
            <h2 style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)', marginTop: '8px', color: 'var(--text-primary)', fontWeight: 800 }}>
              {UI_STRINGS.sessionFlow?.heading || 'How a session happens'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', marginTop: '10px', lineHeight: 1.65 }}>
              {UI_STRINGS.sessionFlow?.subheading || 'A transparent, steady process designed around your schedule and comfort.'}
            </p>
          </div>

          {/* 4 Steps in an open, calm editorial layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '32px',
            marginBottom: '48px'
          }}>
            {/* Step 1 */}
            <div style={{ padding: '8px 4px' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--accent-leaf)', letterSpacing: '1px', marginBottom: '12px' }}>
                01
              </div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '8px', lineHeight: 1.3 }}>
                {UI_STRINGS.sessionFlow?.step1Title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {UI_STRINGS.sessionFlow?.step1Desc}
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ padding: '8px 4px' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--accent-lavender-dark)', letterSpacing: '1px', marginBottom: '12px' }}>
                02
              </div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '8px', lineHeight: 1.3 }}>
                {UI_STRINGS.sessionFlow?.step2Title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {UI_STRINGS.sessionFlow?.step2Desc}
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ padding: '8px 4px' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--accent-peach-dark)', letterSpacing: '1px', marginBottom: '12px' }}>
                03
              </div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '8px', lineHeight: 1.3 }}>
                {UI_STRINGS.sessionFlow?.step3Title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {UI_STRINGS.sessionFlow?.step3Desc}
              </p>
            </div>

            {/* Step 4 */}
            <div style={{ padding: '8px 4px' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--accent-sky-dark)', letterSpacing: '1px', marginBottom: '12px' }}>
                04
              </div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '8px', lineHeight: 1.3 }}>
                {UI_STRINGS.sessionFlow?.step4Title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {UI_STRINGS.sessionFlow?.step4Desc}
              </p>
            </div>
          </div>

          {/* Quiet line for professionals */}
          <div style={{
            paddingTop: '28px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            fontSize: '0.92rem',
            color: 'var(--text-secondary)'
          }}>
            <div>
              <span>{UI_STRINGS.sessionFlow?.professionalNoticePrompt}{' '}</span>
              <Link
                to="/register?role=therapist"
                style={{
                  color: 'var(--accent-forest)',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px'
                }}
              >
                {UI_STRINGS.sessionFlow?.professionalNoticeLink}
              </Link>
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              {UI_STRINGS.sessionFlow?.professionalNoticeGuarantee}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. DATA SOVEREIGNTY & PRIVACY ETHICS ── */}
      <section
        ref={privacyRef}
        data-section="privacy"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '40px 24px 80px',
          opacity: revealedSections.privacy ? 1 : 0.2,
          transform: revealedSections.privacy ? 'translateY(0)' : 'translateY(32px)',
          transition: 'all 0.8s cubic-bezier(0.2, 0, 0.2, 1)'
        }}
      >
        <div style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '44px 36px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--accent-forest)', fontWeight: 700 }}>
              {UI_STRINGS.landing?.privacyBadge || 'Zero-Trust Architecture'}
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)', marginTop: '8px', color: 'var(--text-primary)', fontWeight: 800 }}>
              {UI_STRINGS.landing?.privacyTitle || 'Your Mind, Your Sovereignty'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '620px', margin: '10px auto 0', fontSize: '0.98rem', lineHeight: 1.6 }}>
              {UI_STRINGS.landing?.privacySubtitle || 'MindCare was engineered from ground zero to uphold India’s Digital Personal Data Protection (DPDP) Act and international medical privacy standards.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            <div style={{ padding: '22px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--accent-sage-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                color: 'var(--accent-forest)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 700 }}>
                {UI_STRINGS.landing?.privacyItem1Title || 'Client-Side Encryption'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {UI_STRINGS.landing?.privacyItem1Desc || 'Journals and sensitive thoughts are scrambled on your device before transmission. No staff member can read your private reflections.'}
              </p>
            </div>

            <div style={{ padding: '22px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--accent-lavender-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                color: 'var(--accent-lavender-dark)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m4.9 4.9 14.2 14.2" />
                </svg>
              </div>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 700 }}>
                {UI_STRINGS.landing?.privacyItem2Title || 'Zero Ad Monetization'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {UI_STRINGS.landing?.privacyItem2Desc || 'No tracking pixels, third-party brokers, or behavioral analytics cookies. Your emotional rhythm is never an advertising target.'}
              </p>
            </div>

            <div style={{ padding: '22px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--accent-peach-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                color: 'var(--accent-peach-dark)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 700 }}>
                {UI_STRINGS.landing?.privacyItem3Title || 'One-Click Data Purge'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {UI_STRINGS.landing?.privacyItem3Desc || 'Under Settings & Privacy, you can export your complete history in JSON format or trigger an instant, irreversible data erasure anytime.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
