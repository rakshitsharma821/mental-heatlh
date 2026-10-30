import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('mindcare_cookie_consent_v1');
      if (!consent) {
        // Small delay to prevent layout thrashing on initial load
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch (_) {
      // If localStorage is unavailable, fail gracefully
    }
  }, []);

  const handleConsent = (choice) => {
    try {
      localStorage.setItem('mindcare_cookie_consent_v1', choice);
    } catch (_) {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie and Privacy Consent Preferences"
      className="cookie-consent-banner"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        maxWidth: '840px',
        margin: '0 auto',
        zIndex: 9999,
        background: 'var(--bg-card, #ffffff)',
        color: 'var(--text-primary, #1e293b)',
        padding: '20px 24px',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid var(--border-subtle, rgba(82, 183, 136, 0.25))',
        animation: 'slideUpFade 0.3s ease-out'
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(82, 183, 136, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'var(--primary-dark, #2d6a4f)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h2 style={{
              margin: '0 0 4px 0',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary, #1e293b)'
            }}>
              Your Privacy & Sovereign Space
            </h2>
            <p style={{
              margin: 0,
              fontSize: '0.86rem',
              color: 'var(--text-secondary, #475569)',
              lineHeight: 1.5
            }}>
              MindCare uses strictly essential browser storage to secure your session and preserve your offline self-care rhythms. 
              <strong> We strictly prohibit advertising cookies, behavioral tracking pixels, and third-party data brokers.</strong> 
              Learn how we protect you under India’s DPDP Act in our{' '}
              <Link
                to="/cookie-policy"
                style={{
                  color: 'var(--primary-dark, #2d6a4f)',
                  fontWeight: 600,
                  textDecoration: 'underline'
                }}
              >
                Cookie Policy
              </Link>{' '}
              and{' '}
              <Link
                to="/privacy-policy"
                style={{
                  color: 'var(--primary-dark, #2d6a4f)',
                  fontWeight: 600,
                  textDecoration: 'underline'
                }}
              >
                Privacy Notice
              </Link>.
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
          paddingTop: '6px'
        }}>
          <button
            type="button"
            onClick={() => handleConsent('essential')}
            className="btn-ghost"
            style={{
              padding: '9px 18px',
              fontSize: '0.84rem',
              fontWeight: 600,
              borderRadius: '8px'
            }}
            aria-label="Accept Essential Storage Only"
          >
            Essential Only
          </button>

          <button
            type="button"
            onClick={() => handleConsent('all')}
            className="btn-primary"
            style={{
              padding: '9px 22px',
              fontSize: '0.84rem',
              fontWeight: 600,
              borderRadius: '8px',
              background: 'var(--primary-dark, #2d6a4f)',
              borderColor: 'var(--primary-dark, #2d6a4f)'
            }}
            aria-label="Accept All Essential & Preference Storage"
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </aside>
  );
}
