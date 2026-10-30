import React from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_CONFIG } from '../config/legalConfig';

export default function CookiePolicy() {
  const lastUpdated = 'October 30, 2026';

  return (
    <div className="policy-page" style={{
      maxWidth: '960px',
      margin: '0 auto',
      padding: '48px 24px 80px',
      color: 'var(--text-primary)',
      lineHeight: 1.75
    }}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '24px', fontSize: '0.85rem' }}>
        <Link to="/" style={{ color: 'var(--primary-dark)', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>Cookie Policy</span>
      </nav>

      {/* Header Banner */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '24px',
        marginBottom: '36px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: 'rgba(82, 183, 136, 0.15)',
          color: 'var(--primary-dark)',
          borderRadius: '999px',
          fontSize: '0.82rem',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          Zero Ad Tracking • Local Storage Transparency
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
          Cookie & Local Storage Policy
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
          Effective Date: {lastUpdated} • Comprehensive disclosure of client-side storage technologies
        </p>
      </header>

      <div className="policy-content" style={{ fontSize: '0.96rem' }}>
        {/* Section 1 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            1. Preamble: Our Stance on Digital Tracking
          </h2>
          <p>
            At {LEGAL_CONFIG.platformName}, operated by {LEGAL_CONFIG.legalEntityName}, we believe that seeking mental wellness 
            requires an environment of total confidentiality. Unlike conventional consumer websites, 
            <strong> we do not use third-party marketing cookies, behavioral tracking pixels, or cross-site fingerprinting technologies</strong>.
          </p>
          <p>
            This Cookie & Local Storage Policy explains what small data fragments are stored in your browser, why they are essential 
            for your security, and how you retain complete autonomy over them.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            2. Categories of Storage We Use
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', margin: '20px 0' }}>
            {/* Category A */}
            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(82, 183, 136, 0.2)',
                  color: 'var(--primary-dark)',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}>
                  STRICTLY NECESSARY (MANDATORY)
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Authentication & Security Storage</h3>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                These items are technically indispensable for authenticating your session, securing API calls against cross-site forgery, 
                and keeping you logged in as you move between sanctuary modules. Disabling these prevents the platform from functioning.
              </p>
              <div style={{ fontSize: '0.82rem', background: 'var(--bg-glass)', padding: '10px 14px', borderRadius: '8px', color: 'var(--text-primary)' }}>
                <strong>Items used:</strong> <code>token</code> (Encrypted JSON Web Token for authenticated requests), <code>mindcare_user</code> (Basic session identifier), <code>mindcare_cookie_consent_v1</code> (Remembers your consent preference).
              </div>
            </div>

            {/* Category B */}
            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}>
                  FUNCTIONAL & SELF-CARE PREFERENCES (OPTIONAL)
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Personal Comfort Settings</h3>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                These items preserve your personalized relaxation settings so you do not have to reconfigure them each time you open the Sanctuary.
              </p>
              <div style={{ fontSize: '0.82rem', background: 'var(--bg-glass)', padding: '10px 14px', borderRadius: '8px', color: 'var(--text-primary)' }}>
                <strong>Items used:</strong> <code>sanctuary_theme</code> (Light/Dark botanical theme preference), <code>breathing_pacing_rate</code> (Saved respiratory cycle seconds), <code>audio_ambient_volume</code> (Relaxing soundscape volume).
              </div>
            </div>

            {/* Category C */}
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#dc2626',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}>
                  PROHIBITED & ABSENT (ZERO)
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#dc2626' }}>Zero Advertising & Behavioral Trackers</h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                We do NOT install Google Analytics, Meta / Facebook Pixel, TikTok trackers, Hotjar mouse-recording scripts, 
                or data broker cookies. Your mental wellness journey is private and never converted into an ad target.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            3. Summary Table of Client Storage Keys
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px' }}>Key Identifier</th>
                  <th style={{ padding: '12px' }}>Storage Type</th>
                  <th style={{ padding: '12px' }}>Duration</th>
                  <th style={{ padding: '12px' }}>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 12px' }}><code>token</code></td>
                  <td style={{ padding: '10px 12px' }}>localStorage</td>
                  <td style={{ padding: '10px 12px' }}>24 Hours</td>
                  <td style={{ padding: '10px 12px' }}>Secure cryptographic authentication token.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 12px' }}><code>mindcare_cookie_consent_v1</code></td>
                  <td style={{ padding: '10px 12px' }}>localStorage</td>
                  <td style={{ padding: '10px 12px' }}>1 Year</td>
                  <td style={{ padding: '10px 12px' }}>Remembers your cookie consent choice.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 12px' }}><code>mindcare_user</code></td>
                  <td style={{ padding: '10px 12px' }}>localStorage</td>
                  <td style={{ padding: '10px 12px' }}>Session duration</td>
                  <td style={{ padding: '10px 12px' }}>Displays username and public ID on dashboard.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            4. Managing & Deleting Browser Storage
          </h2>
          <p>
            You have full control over your client storage. You may clear your storage at any moment:
          </p>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
            <li><strong>Through Sanctuary Settings:</strong> Navigate to <Link to="/settings" style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>Settings & Privacy</Link> and select “Purge All Local Data” to instantly erase all local browser keys.</li>
            <li><strong>Through Your Browser:</strong> You can configure your browser (Chrome, Firefox, Safari, Edge) to block cookies or clear local storage upon closing the browser.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
            5. Inquiries & Data Privacy Officer
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
            For questions regarding our client-side storage technologies or DPDP Act compliance, please reach out to our privacy desk:
          </p>
          <div style={{ fontSize: '0.86rem', lineHeight: 1.8, color: 'var(--text-primary)' }}>
            <div><strong>Email:</strong> <a href={`mailto:${LEGAL_CONFIG.contact.privacyEmail}`} style={{ color: 'var(--primary-dark)' }}>{LEGAL_CONFIG.contact.privacyEmail}</a></div>
            <div><strong>Grievance Officer:</strong> {LEGAL_CONFIG.grievanceOfficer.name} ({LEGAL_CONFIG.grievanceOfficer.email})</div>
          </div>
        </section>
      </div>
    </div>
  );
}
