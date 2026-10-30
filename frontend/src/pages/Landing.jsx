// ============================================
// MindCare Sanctuary — Redesigned Light-Theme Landing Page
// Featuring:
// 1. Interactive 3D Brain Hero (three.js) with ScrollTrigger scrubbed transition:
//    Starts "busy" (noisy warm peach glow) -> settles to "calm" (gentle sage/sky breathing)
// 2. Faint topographic contour lines drifting slowly in background
// 3. Unhurried scroll story:
//    - Hero (headline + 2 CTAs left, 3D brain right)
//    - Beat 1: The Problem ("A busy mind")
//    - Beat 2: The Sanctuary Approach ("One slow breath")
//    - Beat 3: Four Sanctuary Feature Cards (in scratch-built 3D TiltCards)
//    - Beat 4: Crisis-Support Strip (emergency helplines with clickable tel links)
//    - Beat 5: Final Call to Action
// 4. Strict light theme, WCAG AA compliance, zero emoji/pyramid ornaments
// ============================================

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}
import { useAuth } from '../context/AuthContext';
import TiltCard from '../components/common/TiltCard';
import MagneticButton from '../components/common/MagneticButton';
import TopographicContourBackground from '../components/common/TopographicContourBackground';
import { UI_STRINGS } from '../config/strings';

// Lazy-load the Three.js Calm Brain Hero
const CalmBrainHero = React.lazy(() => import('../components/three/CalmBrainHero'));

export default function Landing() {
  const { user } = useAuth();
  const [calmProgress, setCalmProgress] = useState(0.0);

  // Section references for scroll reveal
  const storyRef = useRef(null);
  const problemRef = useRef(null);
  const breathRef = useRef(null);
  const featuresRef = useRef(null);
  const crisisRef = useRef(null);
  const finalCtaRef = useRef(null);

  const [revealed, setRevealed] = useState({
    problem: false,
    breath: false,
    features: false,
    crisis: false,
    finalCta: false
  });

  // GSAP ScrollTrigger to scrub 3D brain from busy (0.0) to calm (1.0)
  useEffect(() => {
    let trigger = null;
    try {
      trigger = ScrollTrigger.create({
        trigger: '.landing-page',
        start: 'top top',
        end: '75% bottom',
        scrub: 0.6,
        onUpdate: (self) => {
          // As user begins scrolling, smoothly transition from busy (0.0) to calm (1.0)
          const p = Math.min(1.0, Math.max(0.0, self.progress * 2.2));
          setCalmProgress(Number(p.toFixed(3)));
        }
      });
    } catch (_) {
      // Fallback: window scroll listener
      const handleScroll = () => {
        const scrolled = window.scrollY;
        const maxScroll = 600;
        const p = Math.min(1.0, scrolled / maxScroll);
        setCalmProgress(Number(p.toFixed(3)));
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }

    return () => {
      if (trigger) trigger.kill();
    };
  }, []);

  // IntersectionObserver for calm scroll story reveals (400-800ms unhurried easing)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const key = entry.target.getAttribute('data-reveal');
          if (key) {
            setRevealed(prev => ({ ...prev, [key]: true }));
          }
        }
      });
    }, { threshold: 0.18 });

    const refs = [problemRef, breathRef, featuresRef, crisisRef, finalCtaRef];
    refs.forEach(r => {
      if (r.current) observer.observe(r.current);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page" style={{ position: 'relative', overflowX: 'hidden', backgroundColor: 'var(--bg-primary, #faf9f5)' }}>
      {/* Faint ambient topographic contour lines drifting in background */}
      <TopographicContourBackground />

      {/* ── 1. HERO SECTION (HEADLINE & 2 CTAs LEFT, 3D BRAIN RIGHT) ── */}
      <section className="hero-section" style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px 40px',
        position: 'relative',
        zIndex: 1
      }}>
        <div className="hero-grid-container" style={{
          maxWidth: '1360px',
          width: '100%',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.08fr 0.92fr',
          gap: '40px',
          alignItems: 'center'
        }}>
          {/* Hero Left: Large airy typography & CTAs */}
          <div className="hero-text-col" style={{ zIndex: 2 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              background: 'var(--accent-sage-soft, #eaf4ee)',
              border: '1px solid rgba(82, 183, 136, 0.28)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.86rem',
              fontWeight: 600,
              color: 'var(--accent-forest, #245741)',
              marginBottom: '26px'
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-leaf)' }}>
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
              </svg>
              <span>{UI_STRINGS.hero?.badge || 'Confidential Mental Wellness Sanctuary'}</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.7rem, 5.2vw, 4.3rem)',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              lineHeight: 1.14,
              marginBottom: '24px',
              letterSpacing: '-0.025em',
              color: 'var(--text-primary, #1a2e22)'
            }}>
              {UI_STRINGS.hero?.titleLine1 || 'Heal slowly.'}<br />
              <span style={{ color: 'var(--accent-leaf, #357255)' }}>
                {UI_STRINGS.hero?.titleLine2 || 'Rise stronger.'}
              </span>
            </h1>

            <p style={{
              fontSize: '1.14rem',
              color: 'var(--text-secondary, #2d4a3e)',
              lineHeight: 1.75,
              marginBottom: '36px',
              maxWidth: '540px'
            }}>
              {UI_STRINGS.hero?.subtext || 'An unhurried space for mindful breathwork, emotional rhythm tracking, and gentle cognitive reflection. Free of judgment, ads, and surveillance.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <Link to={user ? "/dashboard" : "/register"} style={{ textDecoration: 'none' }}>
                <MagneticButton
                  className="btn-primary"
                  style={{ padding: '16px 36px', fontSize: '1rem', minHeight: '48px' }}
                >
                  <span>{user ? (UI_STRINGS.hero?.ctaDashboard || 'Open Your Dashboard →') : (UI_STRINGS.hero?.ctaRegister || 'Begin Sanctuary Journey →')}</span>
                </MagneticButton>
              </Link>
              <Link
                to="/breathing"
                className="btn-ghost"
                style={{ padding: '15px 28px', fontSize: '0.96rem', minHeight: '48px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                  <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                </svg>
                <span>{UI_STRINGS.hero?.ctaBreathing || '3D Breathwork'}</span>
              </Link>
            </div>

            {/* Privacy Guarantee Note */}
            <div style={{ marginTop: '36px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-forest)', flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>{UI_STRINGS.hero?.privacyNote || 'Zero ad tracking • AES-256 Encrypted Journals • DPDP Compliant'}</span>
            </div>
          </div>

          {/* Hero Right: Interactive 3D Brain Hero (Three.js) */}
          <div className="hero-brain-col" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <Suspense fallback={
              <div style={{ width: '100%', height: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="sanctuary-loader-rings" style={{ width: '60px', height: '60px' }}>
                  <div className="loader-ring ring-1" />
                </div>
              </div>
            }>
              <CalmBrainHero calmProgress={calmProgress} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── 2. SCROLL STORY: BEAT 1 — THE PROBLEM ("A BUSY MIND") ── */}
      <section
        ref={problemRef}
        data-reveal="problem"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '80px 24px 60px',
          opacity: revealed.problem ? 1 : 0.25,
          transform: revealed.problem ? 'translateY(0)' : 'translateY(28px)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div className="sanctuary-card-elevated" style={{
          padding: '52px 44px',
          borderLeft: '4px solid var(--accent-peach, #e99a80)',
          background: '#ffffff'
        }}>
          <div style={{ maxWidth: '780px' }}>
            <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '2.5px', color: 'var(--accent-peach-dark, #c26d52)', fontWeight: 700 }}>
              The Problem We Face
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 3.6vw, 2.7rem)', marginTop: '10px', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
              A busy mind.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.08rem', lineHeight: 1.8, marginTop: '16px' }}>
              Relentless notification streams, academic and career benchmarks, and constant ambient noise leave our nervous systems trapped in perpetual low-grade emergency. We try to think our way out of mental friction, but the brain needs space—not more input.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. SCROLL STORY: BEAT 2 — THE SANCTUARY APPROACH ("ONE SLOW BREATH") ── */}
      <section
        ref={breathRef}
        data-reveal="breath"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '30px 24px 70px',
          opacity: revealed.breath ? 1 : 0.25,
          transform: revealed.breath ? 'translateY(0)' : 'translateY(28px)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div className="sanctuary-card-elevated" style={{
          padding: '52px 44px',
          borderLeft: '4px solid var(--accent-leaf, #357255)',
          background: '#ffffff'
        }}>
          <div style={{ maxWidth: '780px' }}>
            <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '2.5px', color: 'var(--accent-forest, #245741)', fontWeight: 700 }}>
              The Sanctuary Approach
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 3.6vw, 2.7rem)', marginTop: '10px', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
              One slow breath.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.08rem', lineHeight: 1.8, marginTop: '16px' }}>
              MindCare is an unhurried, pressure-free sanctuary. No streaks to lose, no public leaderboards, and zero unsolicited advice. Just tactile grounding tools, private journaling defended with AES-256 encryption, and compassionate human support when you choose to seek it.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. SCROLL STORY: BEAT 3 — FOUR SANCTUARY FEATURE CARDS ── */}
      <section
        ref={featuresRef}
        data-reveal="features"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '30px 24px 80px',
          opacity: revealed.features ? 1 : 0.25,
          transform: revealed.features ? 'translateY(0)' : 'translateY(28px)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '46px' }}>
          <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--accent-forest)', fontWeight: 700 }}>
            {UI_STRINGS.landing?.coreBadge || 'Sanctuary Core'}
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 3.6vw, 2.8rem)', marginTop: '8px', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
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
          {/* Card 1: 3D Guided Breathwork */}
          <TiltCard>
            <div className="sanctuary-card-elevated" style={{ height: '100%', padding: '34px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'var(--accent-sage-soft)',
                  color: 'var(--accent-forest)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                  {UI_STRINGS.landing?.pillar1Title || '3D Guided Breathwork'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.68 }}>
                  {UI_STRINGS.landing?.pillar1Desc || 'A calming procedural brain and responsive rhythm orb that expands and contracts with your natural respiratory cycles.'}
                </p>
              </div>
              <Link to="/breathing" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '22px', color: 'var(--accent-forest)', fontWeight: 600, fontSize: '0.9rem' }}>
                <span>{UI_STRINGS.landing?.pillar1Cta || 'Begin Breathwork →'}</span>
              </Link>
            </div>
          </TiltCard>

          {/* Card 2: Aria Care Companion */}
          <TiltCard>
            <div className="sanctuary-card-elevated" style={{ height: '100%', padding: '34px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'var(--accent-lavender-soft)',
                  color: 'var(--accent-lavender-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                  {UI_STRINGS.landing?.pillar2Title || 'Aria Care Companion'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.68 }}>
                  {UI_STRINGS.landing?.pillar2Desc || 'A warm, grounded wellness friend governed by strict safe-language rules. Aria never diagnoses, never echoes negative triggers, and offers calm guidance.'}
                </p>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '22px', color: 'var(--accent-lavender-dark)', fontWeight: 600, fontSize: '0.9rem' }}>
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                </svg>
                <span>{UI_STRINGS.landing?.pillar2Badge || 'Always Available in Corner'}</span>
              </span>
            </div>
          </TiltCard>

          {/* Card 3: Encrypted Journal */}
          <TiltCard>
            <div className="sanctuary-card-elevated" style={{ height: '100%', padding: '34px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'var(--accent-peach-soft)',
                  color: 'var(--accent-peach-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                  {UI_STRINGS.landing?.pillar3Title || 'Encrypted Journal'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.68 }}>
                  {UI_STRINGS.landing?.pillar3Desc || 'A private shelter for unfiltered reflection. Thought logs are defended with authenticated AES-256-GCM encryption before storage.'}
                </p>
              </div>
              <Link to="/journal" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '22px', color: 'var(--accent-peach-dark)', fontWeight: 600, fontSize: '0.9rem' }}>
                <span>{UI_STRINGS.landing?.pillar3Cta || 'Open Private Journal →'}</span>
              </Link>
            </div>
          </TiltCard>

          {/* Card 4: Licensed Clinicians */}
          <TiltCard>
            <div className="sanctuary-card-elevated" style={{ height: '100%', padding: '34px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'var(--accent-sky-soft)',
                  color: 'var(--accent-sky-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                  Verified Clinicians
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.68 }}>
                  When self-reflection calls for professional human guidance, schedule confidential video consultations with verified psychologists and psychiatrists.
                </p>
              </div>
              <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '22px', color: 'var(--accent-sky-dark)', fontWeight: 600, fontSize: '0.9rem' }}>
                <span>Explore Consultations →</span>
              </Link>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ── 5. SCROLL STORY: BEAT 4 — CRISIS-SUPPORT STRIP ── */}
      <section
        ref={crisisRef}
        data-reveal="crisis"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '20px 24px 60px',
          opacity: revealed.crisis ? 1 : 0.25,
          transform: revealed.crisis ? 'translateY(0)' : 'translateY(28px)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{
          background: 'var(--color-error-soft, #fdebee)',
          border: '1px solid rgba(239, 68, 68, 0.28)',
          borderRadius: '24px',
          padding: '32px 36px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px'
        }}>
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700, color: '#b91c1c', marginBottom: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>24/7 Immediate Crisis Assistance</span>
            </div>
            <h3 style={{ fontSize: '1.3rem', color: '#7f1d1d', fontFamily: "'Outfit', sans-serif", fontWeight: 700, margin: '4px 0 10px' }}>
              You never have to carry deep distress alone.
            </h3>
            <p style={{ color: '#991b1b', fontSize: '0.94rem', lineHeight: 1.65 }}>
              Free, confidential national mental health hotlines are standing by right now. Reach out anytime:
              {' '}
              <a href="tel:14416" style={{ color: '#7f1d1d', fontWeight: 700, textDecoration: 'underline' }}>Tele-MANAS: 14416</a>
              {' • '}
              <a href="tel:988" style={{ color: '#7f1d1d', fontWeight: 700, textDecoration: 'underline' }}>Lifeline: 988</a>
            </p>
          </div>
          <Link
            to="/crisis"
            className="btn-primary"
            style={{
              background: '#b91c1c',
              borderColor: '#991b1b',
              padding: '12px 28px',
              fontSize: '0.92rem',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Open Safety Planner →</span>
          </Link>
        </div>
      </section>

      {/* ── 6. SCROLL STORY: BEAT 5 — FINAL CALL TO ACTION ── */}
      <section
        ref={finalCtaRef}
        data-reveal="finalCta"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '20px 24px 100px',
          opacity: revealed.finalCta ? 1 : 0.25,
          transform: revealed.finalCta ? 'translateY(0)' : 'translateY(28px)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div className="sanctuary-card-elevated" style={{
          padding: '64px 44px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #ffffff 0%, #f7faf7 100%)',
          borderRadius: '28px'
        }}>
          <h2 style={{
            fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '16px'
          }}>
            Step inside your sanctuary today.
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            maxWidth: '560px',
            margin: '0 auto 34px',
            lineHeight: 1.7
          }}>
            Zero cost, zero tracking. Create your private space and give your mind permission to breathe.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link to={user ? "/dashboard" : "/register"} style={{ textDecoration: 'none' }}>
              <MagneticButton
                className="btn-primary"
                style={{ padding: '16px 38px', fontSize: '1rem', minHeight: '48px' }}
              >
                <span>{user ? 'Return to Dashboard →' : 'Begin Sanctuary Journey →'}</span>
              </MagneticButton>
            </Link>
            <Link
              to="/terms"
              className="btn-ghost"
              style={{ padding: '15px 28px', fontSize: '0.96rem', minHeight: '48px' }}
            >
              <span>Read Privacy Ethics</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
