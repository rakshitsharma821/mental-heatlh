// ============================================
// MindCare Sanctuary – Welcome & Encouraging Note Page
// Flow Step 3: DYNAMIC AI-GENERATED ENCOURAGING MESSAGE
// Powered by OpenRouter AI via backend /api/assessment/welcome-message
// Session-cached so re-renders do not repeat API calls
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Storage } from '../services/storage';
import { API_BASE_URL } from '../config/appConfig';
import { getRandomFallback } from '../config/welcomeMessages';

const SESSION_CACHE_KEY = 'mindcare_welcome_msg_cache';

export default function Welcome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name ? user.name.split(' ')[0] : 'Friend';

  const [aiMessage, setAiMessage] = useState('');
  const [loadingAi, setLoadingAi] = useState(true);
  const [canSkipLoading, setCanSkipLoading] = useState(false);
  const skipTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  const userId = user?.id || 'anon';
  const sessionCacheKey = `mindcare_welcome_msg_${userId}`;

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchAiMessage = async () => {
    setLoadingAi(true);
    setCanSkipLoading(false);

    // Show "skip" option after 3 seconds if still loading
    skipTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) setCanSkipLoading(true);
    }, 3000);

    try {
      const token = Storage.get('mindcare_auth_token') || localStorage.getItem('mindcare_auth_token');
      if (!token) {
        // Not authenticated – show fallback immediately
        const fallback = getRandomFallback(displayName);
        if (isMountedRef.current) {
          setAiMessage(fallback);
          setLoadingAi(false);
        }
        return;
      }

      // Fetch freshly generated AI welcome message from OpenRouter
      const res = await fetch(`${API_BASE_URL}/assessment/welcome-message?fresh=true`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (isMountedRef.current && data.success && data.message) {
        setAiMessage(data.message);
      } else {
        throw new Error('Empty response');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setAiMessage(getRandomFallback(displayName));
      }
    } finally {
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
      if (isMountedRef.current) {
        setLoadingAi(false);
        setCanSkipLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAiMessage();

    return () => {
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    };
  }, [displayName]);

  const handleSkipLoading = () => {
    if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    setAiMessage(getRandomFallback(displayName));
    setLoadingAi(false);
    setCanSkipLoading(false);
  };

  return (
    <div style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      backgroundColor: 'var(--bg-main, #f8fbf9)',
      overflow: 'hidden'
    }}>
      {/* Gentle iridescent aurora backdrop glow behind glass card */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '540px',
          height: '540px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(116, 198, 157, 0.25) 0%, rgba(157, 132, 183, 0.16) 42%, rgba(246, 189, 96, 0.10) 70%, transparent 80%)',
          filter: 'blur(64px)',
          pointerEvents: 'none',
          animation: 'pulseSlow 9s ease-in-out infinite',
          zIndex: 0
        }}
      />

      <div className="glass-card" style={{
        maxWidth: '580px',
        width: '100%',
        padding: '40px 36px',
        textAlign: 'center',
        borderRadius: '24px',
        border: '1.5px solid var(--border-hover, rgba(82, 183, 136, 0.3))',
        backgroundColor: 'var(--bg-card, #ffffff)',
        boxShadow: '0 20px 45px rgba(0,0,0,0.06)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ fontSize: '3.2rem', marginBottom: '14px' }}></div>

        <span style={{
          display: 'inline-block',
          padding: '4px 14px',
          borderRadius: '100px',
          background: 'rgba(82, 183, 136, 0.15)',
          color: 'var(--primary-dark)',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          marginBottom: '16px'
        }}>
          YOUR PERSONAL REFLECTION · MINDCARE SANCTUARY
        </span>

        <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.1rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '18px', lineHeight: 1.3 }}>
          Take a Gentle Breath, {displayName}.
        </h1>

        {/* AI Message Box */}
        <div style={{
          minHeight: '90px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '12px',
          padding: '18px 22px',
          borderRadius: '18px',
          background: 'rgba(82, 183, 136, 0.08)',
          border: '1.2px solid rgba(82, 183, 136, 0.25)',
          marginBottom: '26px'
        }}>
          {loadingAi ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                <span style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(0,0,0,0.1)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <span style={{ fontSize: '0.92rem' }}>Preparing your personalized reflection...</span>
              </div>
              {canSkipLoading && (
                <button
                  type="button"
                  onClick={handleSkipLoading}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(82, 183, 136, 0.4)',
                    color: 'var(--primary-dark)',
                    padding: '6px 16px',
                    borderRadius: '100px',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Skip to questionnaire →
                </button>
              )}
            </>
          ) : (
            <>
              <p
                key={aiMessage}
                className="reveal-text"
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  lineHeight: '1.65',
                  fontStyle: 'italic',
                  margin: 0
                }}
              >
                "{aiMessage}"
              </p>
              <button
                type="button"
                onClick={fetchAiMessage}
                disabled={loadingAi}
                style={{
                  background: 'rgba(82, 183, 136, 0.1)',
                  border: '1px solid rgba(82, 183, 136, 0.4)',
                  color: 'var(--primary-dark, #2d6a4f)',
                  padding: '5px 14px',
                  borderRadius: '100px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px'
                }}
                title="Generate a fresh personalized note with AI"
              >
                 Generate New Reflection
              </button>
            </>
          )}
        </div>

        {/* AI Disclosure (A1.6) */}
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.76rem',
          lineHeight: '1.5',
          marginBottom: '16px'
        }}>
          Your first name is sent to an AI provider (OpenRouter) to personalize your welcome message.
        </p>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '32px' }}>
          MindCare is designed as an unhurried space for young adults. Before exploring, we'll walk through a <strong>fixed 8-question reflection</strong>. It takes just 2 minutes to tune your personalized focus games, breathwork, and calming soundscapes.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              navigate('/questionnaire');
            }}
            style={{
              padding: '16px 36px',
              fontSize: '1.05rem',
              fontWeight: 600,
              borderRadius: '16px',
              width: '100%',
              maxWidth: '360px',
              boxShadow: '0 8px 24px rgba(82, 183, 136, 0.35)'
            }}
          >
            Begin 2-Minute Questionnaire 
          </button>

          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate('/dashboard')}
            style={{ padding: '10px 20px', fontSize: '0.88rem', border: 'none', color: 'var(--text-muted)' }}
          >
            Skip directly to Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}
