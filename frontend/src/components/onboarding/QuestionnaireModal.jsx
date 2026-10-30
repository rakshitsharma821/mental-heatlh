// ============================================
// MindCare Sanctuary — Assessment & Onboarding Questionnaire Component
// Flow: Welcome message → 5 Fixed Clinical Questions (20–25 age audience)
//       → Score Calculation → Evidence-based Activity Recommendation
//       (Games, Breathing, Yoga/Movement, Meditations, Calming Music)
// Constraint: 100% Static ambient background (Zero animated particles/motion)
// ============================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Storage } from '../../services/storage';

// 5 fixed clinical questions (GAD/PHQ derived scale 0–3)
export const ONBOARDING_QUESTIONS = [
  {
    id: 'q1',
    category: 'energy',
    question: 'How has your physical and mental energy felt over the last couple of days?',
    options: [
      { text: 'Steady, refreshed, and motivated', score: 0 },
      { text: 'Slightly drained by midday', score: 1 },
      { text: 'Heavy lethargy or low enthusiasm', score: 2 },
      { text: 'Completely exhausted and burned out', score: 3 }
    ]
  },
  {
    id: 'q2',
    category: 'anxiety',
    question: 'How often do racing thoughts or tension interrupt your peace?',
    options: [
      { text: 'Rarely, mind feels spacious', score: 0 },
      { text: 'Occasionally when deadlines or tasks arise', score: 1 },
      { text: 'Often, feel wound up or restless', score: 2 },
      { text: 'Almost constantly on edge or overwhelmed', score: 3 }
    ]
  },
  {
    id: 'q3',
    category: 'calmness',
    question: 'When you take a pause, how easy is it to relax your shoulders and breathe easy?',
    options: [
      { text: 'Effortless to drop into stillness', score: 0 },
      { text: 'Takes a few moments of conscious effort', score: 1 },
      { text: 'Hard to shake off bodily tightness', score: 2 },
      { text: 'Feel stuck in survival / fight-or-flight mode', score: 3 }
    ]
  },
  {
    id: 'q4',
    category: 'sleep',
    question: 'How restful has your sleep and wind-down routine been lately?',
    options: [
      { text: 'Deep, uninterrupted, and restorative', score: 0 },
      { text: 'Takes longer to fall asleep than usual', score: 1 },
      { text: 'Broken sleep or wake up tired', score: 2 },
      { text: 'Severe insomnia or disrupted sleep cycle', score: 3 }
    ]
  },
  {
    id: 'q5',
    category: 'focus',
    question: 'How clearly have you been able to focus without mental fog or distraction?',
    options: [
      { text: 'Clear head and steady focus', score: 0 },
      { text: 'Mild distraction, manageable with effort', score: 1 },
      { text: 'Frequent brain fog or scattered attention', score: 2 },
      { text: 'Paralyzing overload or inability to concentrate', score: 3 }
    ]
  }
];

export default function QuestionnaireModal({ isOpen, onClose, onComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState('welcome'); // 'welcome' | 'questions' | 'result'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [recommendation, setRecommendation] = useState(null);

  if (!isOpen) return null;

  const currentQ = ONBOARDING_QUESTIONS[currentIndex];

  const handleSelectOption = (qId, score) => {
    setAnswers(prev => ({ ...prev, [qId]: score }));
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const calculateResult = () => {
    // Total score: min 0, max 15
    const totalScore = Object.values(answers).reduce((acc, val) => acc + (Number(val) || 0), 0);
    
    // Evaluate primary need based on score
    let rec = {
      score: totalScore,
      maxScore: 15,
      tier: 'mild',
      headline: 'Gentle Mindful Exploration',
      description: 'Your nervous system shows steady resilience. A quick grounding session or light focus game can maintain your balance.',
      primaryActivity: {
        name: 'Zen Garden & Sensory Focus',
        route: '/games',
        badge: 'Interactive Game',
        icon: ''
      },
      secondaryActivity: {
        name: 'Physiological Sigh Breathing',
        route: '/breathing',
        badge: 'Somatic Breath',
        icon: ''
      },
      musicRecommendation: 'Ambient Lo-Fi & Forest Solitude Soundscapes',
      exerciseRecommendation: 'Light mindful walking or gentle stretching'
    };

    if (totalScore >= 10) {
      // High stress / fatigue
      rec = {
        score: totalScore,
        maxScore: 15,
        tier: 'high',
        headline: 'Deep Autonomic Down-Regulation & Care',
        description: 'You are carrying significant emotional and cognitive load right now. Let us prioritize soothing your nervous system first.',
        primaryActivity: {
          name: 'Box Breathing (4-4-4-4) & Somatic Grounding',
          route: '/breathing',
          badge: 'Immediate Grounding',
          icon: ''
        },
        secondaryActivity: {
          name: 'Ripple Tap & Calming Games',
          route: '/games',
          badge: 'Decompression Game',
          icon: ''
        },
        musicRecommendation: '432Hz Binaural Delta Waves & Soft Rain Meditation',
        exerciseRecommendation: 'Restorative Child\'s Pose, gentle neck rolls, or yoga nidra'
      };
    } else if (totalScore >= 5) {
      // Moderate tension / fatigue
      rec = {
        score: totalScore,
        maxScore: 15,
        tier: 'moderate',
        headline: 'Balanced Decompression & Reset',
        description: 'Noticeable tension has accumulated. A 3-minute breath cycle followed by calming puzzles will help untangle mental friction.',
        primaryActivity: {
          name: '4-7-8 Relaxation Breath',
          route: '/breathing',
          badge: 'Breath Regulation',
          icon: ''
        },
        secondaryActivity: {
          name: 'Color Harmony & Focus Blocks',
          route: '/games',
          badge: 'Mindful Game',
          icon: ''
        },
        musicRecommendation: 'Acoustic Piano & Gentle Flow Ambient Melodies',
        exerciseRecommendation: '10-minute Sun Salutations or desk postural release'
      };
    }

    // Save assessment to local storage for roadmap engine
    try {
      const assessmentRecord = {
        date: new Date().toISOString(),
        score: totalScore,
        answers,
        recommendation: rec
      };
      Storage.set('mindcare_onboarding_assessment', assessmentRecord);
      Storage.set('mindcare_has_completed_onboarding', true);
    } catch (e) {
      console.warn('Failed to save assessment to storage:', e);
    }

    setRecommendation(rec);
    setStep('result');
  };

  const handleRouteToActivity = (route) => {
    if (onComplete) onComplete(recommendation);
    if (onClose) onClose();
    navigate(route);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(10, 20, 16, 0.75)',
        backdropFilter: 'blur(10px)',
        padding: '16px'
      }}
    >
      {/* 
        CRITICAL CONSTRAINT: 
        Zero moving/animated background objects inside questionnaire or data-entry modal.
        Background is solid clean translucent glass without particle canvas.
      */}
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text-primary, #1e293b)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          border: '1.5px solid var(--border-hover, rgba(82, 183, 136, 0.3))',
          padding: '32px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'none' // Strict override: zero motion
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted, #94a3b8)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Close Questionnaire Dialog"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* STEP 1: WELCOME SCREEN */}
        {step === 'welcome' && (
          <div style={{ textAlign: 'center', padding: '12px 8px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}></div>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: '999px',
                background: 'rgba(82, 183, 136, 0.15)',
                color: 'var(--primary-dark, #1b4332)',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '16px',
                letterSpacing: '0.04em'
              }}
            >
              WELCOME TO MINDCARE SANCTUARY
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary, #0f172a)' }}>
              Take a Soft Breath. You're in a Safe Space.
            </h2>
            <p style={{ color: 'var(--text-secondary, #475569)', fontSize: '0.98rem', lineHeight: '1.6', marginBottom: '28px' }}>
              We know life between 20–25 comes with heavy transitions, work deadlines, and quiet pressures. 
              Before diving in, answer <strong>5 brief questions</strong> so MindCare can adapt your games, music, and breathing to exactly how you feel today.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setStep('questions')}
                style={{
                  padding: '14px 32px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: '14px'
                }}
              >
                Begin 2-Minute Pulse 
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={onClose}
                style={{ padding: '14px 20px', borderRadius: '14px' }}
              >
                Explore Sanctuary First
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FIXED 5-QUESTION ASSESSMENT */}
        {step === 'questions' && currentQ && (
          <div>
            {/* Header / Progress Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary, #2d6a4f)' }}>
                Question {currentIndex + 1} of {ONBOARDING_QUESTIONS.length}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {ONBOARDING_QUESTIONS.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '26px',
                      height: '5px',
                      borderRadius: '4px',
                      backgroundColor: idx <= currentIndex ? 'var(--primary, #52b788)' : 'rgba(0,0,0,0.1)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Question Text */}
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '22px', lineHeight: 1.4 }}>
              {currentQ.question}
            </h3>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = answers[currentQ.id] === opt.score;
                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleSelectOption(currentQ.id, opt.score)}
                    style={{
                      textAlign: 'left',
                      padding: '14px 18px',
                      borderRadius: '14px',
                      border: isSelected
                        ? '2px solid var(--primary, #2d6a4f)'
                        : '1.5px solid var(--border, rgba(0,0,0,0.08))',
                      backgroundColor: isSelected
                        ? 'rgba(82, 183, 136, 0.12)'
                        : 'rgba(255, 255, 255, 0.6)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.94rem',
                      fontWeight: isSelected ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'border 0.2s, background-color 0.2s'
                    }}
                  >
                    <span>{opt.text}</span>
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: isSelected ? '5px solid var(--primary, #2d6a4f)' : '1.5px solid #cbd5e1',
                        backgroundColor: '#fff',
                        display: 'inline-block'
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  opacity: currentIndex === 0 ? 0.3 : 1,
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Back
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleNext}
                disabled={answers[currentQ.id] === undefined}
                style={{
                  padding: '12px 26px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  opacity: answers[currentQ.id] === undefined ? 0.5 : 1,
                  cursor: answers[currentQ.id] === undefined ? 'not-allowed' : 'pointer'
                }}
              >
                {currentIndex === ONBOARDING_QUESTIONS.length - 1 ? 'Compute My Plan ' : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SCORE-BASED RECOMMENDATION SCREEN */}
        {step === 'result' && recommendation && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  background: 'rgba(82, 183, 136, 0.15)',
                  color: 'var(--primary-dark)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  marginBottom: '10px'
                }}
              >
                ASSESSMENT SCORE: {recommendation.score} / {recommendation.maxScore}
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {recommendation.headline}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {recommendation.description}
              </p>
            </div>

            {/* Activity Recommendations Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {/* Primary Activity */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1.5px solid var(--primary, #52b788)',
                  background: 'rgba(82, 183, 136, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{recommendation.primaryActivity.icon}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
                      {recommendation.primaryActivity.badge}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {recommendation.primaryActivity.name}
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleRouteToActivity(recommendation.primaryActivity.route)}
                  style={{ marginTop: '12px', padding: '8px 14px', fontSize: '0.85rem', width: '100%' }}
                >
                  Start Now →
                </button>
              </div>

              {/* Secondary Activity */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1.5px solid var(--border, rgba(0,0,0,0.1))',
                  background: 'rgba(255, 255, 255, 0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{recommendation.secondaryActivity.icon}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {recommendation.secondaryActivity.badge}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {recommendation.secondaryActivity.name}
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => handleRouteToActivity(recommendation.secondaryActivity.route)}
                  style={{ marginTop: '12px', padding: '8px 14px', fontSize: '0.85rem', width: '100%' }}
                >
                  Explore →
                </button>
              </div>
            </div>

            {/* Music & Movement Snapshot */}
            <div
              style={{
                background: 'rgba(0,0,0,0.03)',
                borderRadius: '14px',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{ marginBottom: '6px' }}>
                 <strong>Calming Music:</strong> {recommendation.musicRecommendation}
              </div>
              <div>
                 <strong>Movement / Yoga:</strong> {recommendation.exerciseRecommendation}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (onComplete) onComplete(recommendation);
                  if (onClose) onClose();
                }}
                style={{ flex: 1, padding: '12px 20px', borderRadius: '12px', fontWeight: 600 }}
              >
                Go to My Dashboard 
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
