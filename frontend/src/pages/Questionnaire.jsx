// ============================================
// MindCare Sanctuary — Focus-Mode Questionnaire Page
// Part 2 Client Experience:
// - Fixed 8 questions, fixed 0-3 scale, one question per screen, no branching
// - Progress shown as simple text ("3 / 8"), no animations
// - Skippable tip screen about phone's Do Not Disturb / Guided Access
// - Strong blurred static backdrop, zero moving objects/animations
// - Autosave each answer to localStorage & backend
// - Safety: Always visible "Take a break / Exit" and discreet "/crisis" link
// - Navigation guard: custom in-app click interception + popstate back step + beforeunload
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QUESTIONNAIRE_CONFIG, getBandForScore } from '../config/questionnaire';
import { Storage } from '../services/storage';
import { API_BASE_URL } from '../config/appConfig';

export default function Questionnaire() {
  const navigate = useNavigate();
  const [showTip, setShowTip] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isTabBlurred, setIsTabBlurred] = useState(false);
  const [resumedNotice, setResumedNotice] = useState(false);

  const questions = QUESTIONNAIRE_CONFIG.questions;
  const currentQ = questions[currentIndex];

  // 1. Fullscreen exit cleanup on unmount
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // 2. Hide global navigation, footer, and companion drawer during focus mode; silence notifications both client and server-side
  useEffect(() => {
    document.body.classList.add('focus-mode-active');
    try { sessionStorage.setItem('mindcare_focus_mode', 'true'); } catch (e) {}
    
    // Notify server of focus mode start & heartbeat
    const token = Storage.get('mindcare_auth_token') || localStorage.getItem('mindcare_auth_token');
    if (token) {
      fetch(`${API_BASE_URL}/assessment/focus-start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {});
    }

    // Refresh server focus session every 2 minutes while questionnaire is active
    const heartbeatInterval = setInterval(() => {
      const activeToken = Storage.get('mindcare_auth_token') || localStorage.getItem('mindcare_auth_token');
      if (activeToken) {
        fetch(`${API_BASE_URL}/assessment/focus-heartbeat`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${activeToken}` }
        }).catch(() => {});
      }
    }, 2 * 60 * 1000);

    return () => {
      clearInterval(heartbeatInterval);
      document.body.classList.remove('focus-mode-active');
      try { sessionStorage.removeItem('mindcare_focus_mode'); } catch (e) {}
      if (token) {
        fetch(`${API_BASE_URL}/assessment/focus-end`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
      }
    };
  }, []);

  // 3. Resume from autosaved draft if present
  useEffect(() => {
    const savedDraft = Storage.get('mindcare_questionnaire_draft', null);
    if (savedDraft && savedDraft.answers && Object.keys(savedDraft.answers).length > 0) {
      setAnswers(savedDraft.answers);
      const answeredCount = Object.keys(savedDraft.answers).length;
      if (answeredCount > 0 && answeredCount < questions.length) {
        setCurrentIndex(answeredCount);
        setShowTip(false); // Skip tip if resuming an ongoing draft
      }
    }
  }, [questions.length]);

  // 4. Distraction detection via Page Visibility API (gentle pause notice, never invalidates)
  useEffect(() => {
    let timer = null;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabBlurred(true);
      } else {
        setIsTabBlurred(false);
        setResumedNotice(true);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => setResumedNotice(false), 5000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timer) clearTimeout(timer);
    };
  }, []);

  // 5. Beforeunload protection (browser reload / tab close)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (Object.keys(answers).length > 0 && Object.keys(answers).length < questions.length) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers, questions.length]);

  // 6. Navigation guard for <BrowserRouter>:
  // - Handles browser Back button via popstate: Back goes to previous question if > 0
  useEffect(() => {
    window.history.pushState({ qStep: currentIndex }, '');

    const handlePopState = () => {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        window.history.pushState({ qStep: currentIndex - 1 }, '');
      } else {
        const confirmExit = window.confirm(
          "Take a pause? Your questionnaire progress is autosaved and ready whenever you return."
        );
        if (confirmExit) {
          navigate('/dashboard');
        } else {
          window.history.pushState({ qStep: 0 }, '');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentIndex, navigate]);

  // Intercept click on in-app links (e.g., if any link clicked accidentally)
  useEffect(() => {
    const handleLinkClick = (e) => {
      const targetLink = e.target.closest('a');
      if (!targetLink) return;

      const href = targetLink.getAttribute('href');
      // Always allow urgent safety link to /crisis without blocking
      if (href === '/crisis' || href?.includes('crisis')) {
        return;
      }

      if (Object.keys(answers).length > 0 && Object.keys(answers).length < questions.length) {
        const ok = window.confirm(
          "Your progress is safely saved. Would you like to pause and step away?"
        );
        if (!ok) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [answers, questions.length]);

  const handleSelectOption = (score) => {
    const updated = { ...answers, [currentQ.id]: score };
    setAnswers(updated);

    // Autosave immediately
    Storage.set('mindcare_questionnaire_draft', {
      answers: updated,
      lastUpdated: new Date().toISOString()
    });
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      await finalizeAssessment();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const finalizeAssessment = async () => {
    setSubmitting(true);
    const totalScore = Object.values(answers).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const band = getBandForScore(totalScore);

    const assessmentResult = {
      totalScore,
      band: band.id,
      bandData: band,
      answers,
      completedAt: new Date().toISOString()
    };

    // Save to local storage
    Storage.set('mindcare_assessment_result', assessmentResult);
    Storage.set('mindcare_has_completed_onboarding', true);
    Storage.remove('mindcare_questionnaire_draft');

    // Post to backend API
    try {
      const token = Storage.get('mindcare_auth_token') || localStorage.getItem('mindcare_auth_token');
      await fetch(`${API_BASE_URL}/assessment/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          total_score: totalScore,
          band: band.id,
          answers
        })
      });
    } catch (e) {
      console.warn('Non-blocking backend assessment log notice:', e.message);
    }

    // Route to Task 4 Recommendations page
    navigate('/recommendations', { replace: true });
  };

  const handleExit = () => {
    const ok = window.confirm(
      "Your progress is saved. Take all the time you need — would you like to return to your dashboard?"
    );
    if (ok) {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      backgroundColor: '#f4f8f5' // Solid calm static backdrop
    }}>
      {/* Full-screen strong blur backdrop overlay (no 3D canvas, no particles) */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        backgroundColor: 'rgba(240, 246, 242, 0.92)',
        zIndex: 1
      }} />

      {/* Top Bar with Safety Controls */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '24px',
        right: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10
      }}>
        <button
          type="button"
          onClick={handleExit}
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '100px',
            padding: '8px 18px',
            fontSize: '0.85rem',
            color: 'var(--text-secondary, #475569)',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          ✕ Take a break / Exit
        </button>

        <Link
          to="/crisis"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: '100px',
            padding: '8px 18px',
            fontSize: '0.85rem',
            color: '#b91c1c',
            textDecoration: 'none',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🛡️</span>
          <span>Need support?</span>
        </Link>
      </div>

      {/* Skippable Tip Screen: Do Not Disturb / Guided Access */}
      {showTip ? (
        <div
          className="glass-card"
          style={{
            position: 'relative',
            zIndex: 5,
            maxWidth: '560px',
            width: '100%',
            padding: '36px',
            borderRadius: '24px',
            backgroundColor: '#ffffff',
            boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
            border: '1.5px solid rgba(82, 183, 136, 0.3)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🌙</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
            A Quiet Space For You
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
            To get the most out of these 8 brief questions, consider switching your device to <strong>Do Not Disturb</strong> or turning on <strong>Guided Access</strong>.
            Take slow breaths — there are no right or wrong answers.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (!document.fullscreenElement && document.documentElement?.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
                setShowTip(false);
              }}
              style={{ padding: '12px 28px', borderRadius: '12px', fontWeight: 600 }}
            >
              Begin Questionnaire →
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                if (!document.fullscreenElement && document.documentElement?.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
                setShowTip(false);
              }}
              style={{ padding: '12px 20px', borderRadius: '12px' }}
            >
              Skip Tip
            </button>
          </div>
        </div>
      ) : (
        /* Question Card (Centered Focus Layout) */
        <div
          className="glass-card"
          style={{
            position: 'relative',
            zIndex: 5,
            maxWidth: '640px',
            width: '100%',
            padding: '36px',
            borderRadius: '28px',
            backgroundColor: '#ffffff',
            boxShadow: '0 25px 60px rgba(0,0,0,0.06)',
            border: '1.5px solid rgba(82, 183, 136, 0.3)',
            filter: isTabBlurred ? 'blur(4px)' : 'none',
            transition: 'filter 0.2s ease'
          }}
        >
          {/* Progress Indicator: Simple text "3 / 8", strictly no animations */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{
              display: 'inline-block',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--primary, #2d6a4f)',
              letterSpacing: '0.04em'
            }}>
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          {/* Question Text */}
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '8px' }}>
            {currentQ.question}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '28px' }}>
            {currentQ.helper}
          </p>

          {/* 0 to 3 Fixed Scale Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {QUESTIONNAIRE_CONFIG.scale.map((opt) => {
              const isSelected = answers[currentQ.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectOption(opt.value)}
                  style={{
                    textAlign: 'left',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    border: isSelected ? '2px solid var(--primary, #2d6a4f)' : '1.5px solid rgba(0,0,0,0.08)',
                    backgroundColor: isSelected ? 'rgba(82, 183, 136, 0.12)' : 'rgba(248, 250, 249, 0.8)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: isSelected ? 700 : 600, fontSize: '0.96rem', marginBottom: '2px' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {opt.detail}
                    </div>
                  </div>

                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: isSelected ? '6px solid var(--primary, #2d6a4f)' : '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    flexShrink: 0
                  }} />
                </button>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
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
              disabled={answers[currentQ.id] === undefined || submitting}
              style={{
                padding: '14px 32px',
                borderRadius: '14px',
                fontWeight: 600,
                fontSize: '0.98rem',
                opacity: answers[currentQ.id] === undefined || submitting ? 0.45 : 1,
                cursor: answers[currentQ.id] === undefined || submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting
                ? 'Computing Plan...'
                : currentIndex === questions.length - 1
                ? 'View My Recommendations ✦'
                : 'Next Question →'}
            </button>
          </div>
        </div>
      )}

      {/* Gentle Distraction Detection Overlay (Non-punitive) */}
      {(isTabBlurred || resumedNotice) && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          zIndex: 20,
          background: 'rgba(27, 67, 50, 0.95)',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '100px',
          fontSize: '0.88rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          🌿 Welcome back! Let's continue right where you left off.
        </div>
      )}
    </div>
  );
}
