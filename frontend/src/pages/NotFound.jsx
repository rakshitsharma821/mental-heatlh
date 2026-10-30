import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Page Not Found | MindCare Sanctuary';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'The page you are looking for is not in the sanctuary. Find calm navigation back to safety and wellness.');
    }
  }, []);

  const homePath = !user 
    ? '/' 
    : (user.role === 'admin' || user.role === 'super_admin' ? '/admin' : (user.role === 'therapist' ? '/therapist' : '/dashboard'));

  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative'
    }}>
      <div className="glass-card" style={{
        maxWidth: '560px',
        width: '100%',
        padding: '48px 36px',
        textAlign: 'center',
        borderRadius: '24px',
        border: '1.5px solid var(--border-subtle, rgba(82, 183, 136, 0.25))',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.05)',
        backgroundColor: 'var(--bg-surface-elevated, #ffffff)'
      }}>
        {/* Soft Botanical Emblem */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-sage-soft, #eaf4ee)',
          color: 'var(--accent-forest, #245741)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 4px 14px rgba(36, 87, 65, 0.12)'
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>

        <span style={{
          display: 'inline-block',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'var(--accent-forest, #245741)',
          marginBottom: '8px'
        }}>
          404 — Path Not Found
        </span>

        <h1 style={{
          fontSize: '1.85rem',
          fontWeight: 700,
          color: 'var(--text-primary, #1a2e22)',
          marginBottom: '14px',
          lineHeight: 1.3
        }}>
          You haven't lost your way.
        </h1>

        <p style={{
          color: 'var(--text-secondary, #2d4a3e)',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          marginBottom: '32px'
        }}>
          The page or peaceful sanctuary space you requested doesn't exist or may have shifted paths. Take a slow, quiet breath and let us guide you back.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '28px'
        }}>
          <Link
            to={homePath}
            className="btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: '0.92rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Return to Sanctuary Space</span>
          </Link>

          <Link
            to="/breathing"
            className="btn-ghost"
            style={{
              padding: '11px 24px',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12a4 4 0 0 1 8 0" />
            </svg>
            <span>Take a Slow Breathing Pause</span>
          </Link>
        </div>

        {/* Crisis SOS Footer Note */}
        <div style={{
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))',
          fontSize: '0.84rem',
          color: 'var(--text-muted, #52796f)'
        }}>
          In distress? You are not alone.{' '}
          <Link
            to="/crisis"
            style={{
              color: '#b91c1c',
              fontWeight: 700,
              textDecoration: 'underline'
            }}
          >
            Access 24/7 Crisis Helplines
          </Link>
          {' '}or call{' '}
          <a
            href="tel:14416"
            style={{
              color: '#b91c1c',
              fontWeight: 700,
              textDecoration: 'underline'
            }}
          >
            Tele-MANAS (14416)
          </a>
        </div>
      </div>
    </div>
  );
}
