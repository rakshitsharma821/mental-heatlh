import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UI_STRINGS } from '../../config/strings';
import { LEGAL_CONFIG } from '../../config/legalConfig';
import { HELPLINES } from '../../../../shared/helplines.js';

export default function Footer() {
  const { user } = useAuth();
  const teleManas = HELPLINES.find(h => h.id === 'tele-manas');
  const kiran = HELPLINES.find(h => h.id === 'kiran');
  const currentYear = new Date().getFullYear();
  const homePath = !user 
    ? '/' 
    : (user.role === 'admin' || user.role === 'super_admin' ? '/admin' : (user.role === 'therapist' ? '/therapist' : '/dashboard'));

  return (
    <footer className="sanctuary-footer" role="contentinfo" aria-label="MindCare Sanctuary Footer">
      <div className="footer-inner">
        {/* Brand Column with Clickable Logo */}
        <div className="footer-brand">
          <Link to={homePath} className="footer-logo" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }} aria-hidden="true">🌿</span>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary, #1a2e22)' }}>
              {LEGAL_CONFIG.platformName}
            </span>
          </Link>
          <p className="footer-sub">{UI_STRINGS.brand.subtext}</p>
          
          <div style={{ marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div><strong>Entity:</strong> {LEGAL_CONFIG.legalEntityName}</div>
            <div><strong>Registered Office:</strong> {LEGAL_CONFIG.registeredOffice.city}, {LEGAL_CONFIG.registeredOffice.state}, India</div>
          </div>

          <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
            <span className="privacy-badge">DPDP Act 2023 Compliant</span>
            <span className="privacy-badge" style={{ background: 'rgba(53, 114, 85, 0.12)', color: 'var(--accent-forest, #245741)' }}>
              RCI Credentialed Network
            </span>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="footer-links">
          {/* Column 1: Sanctuary Activities */}
          <div className="footer-col">
            <h4>{UI_STRINGS.footer.sanctuaryHeading}</h4>
            <Link to="/dashboard">Daily Sanctuary Home</Link>
            <Link to="/breathing">{UI_STRINGS.nav.breathing} Pacer</Link>
            <Link to="/mood">{UI_STRINGS.nav.mood} Check-in</Link>
            <Link to="/journal">Reflective Journal</Link>
            <Link to="/routine">{UI_STRINGS.nav.routine}</Link>
            <Link to="/games">{UI_STRINGS.nav.games}</Link>
            <Link to="/community">{UI_STRINGS.nav.community}</Link>
          </div>

          {/* Column 2: Legal & Data Protection */}
          <div className="footer-col">
            <h4>Legal & Compliance</h4>
            <Link to="/privacy-policy">Privacy Policy (DPDP 2023)</Link>
            <Link to="/terms">Terms & Conditions</Link>
            <Link to="/cookie-policy">Cookie & Storage Policy</Link>
            <Link to="/refund-policy">Refund & Cancellation</Link>
            <Link to="/settings" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <svg width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-0.15em', marginRight: '6px', flexShrink: 0 }} aria-hidden="true">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Data Rights & Controls</span>
            </Link>
            <Link to="/login?portal=therapist">Clinician Workspace</Link>
            <Link to="/login?portal=admin">Administration Console</Link>
          </div>

          {/* Column 3: Emergency & Care */}
          <div className="footer-col">
            <h4>Emergency & Support</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  India (Tele-MANAS)
                </span>
                <a
                  href={`tel:${teleManas?.primaryNumber}`}
                  title="Call Tele-MANAS toll-free 24/7"
                  style={{ color: '#b91c1c', fontWeight: 700, textDecoration: 'none' }}
                >
                  📞 {teleManas?.primaryNumber} (Toll-Free 24/7)
                </a>
              </div>

              <div style={{ marginTop: '2px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  National Mental Helpline (KIRAN)
                </span>
                <a
                  href={`tel:${kiran?.primaryNumber}`}
                  title="Call KIRAN Mental Health Helpline"
                  style={{ color: '#b91c1c', fontWeight: 700, textDecoration: 'none' }}
                >
                  📞 {kiran?.primaryNumber} (24/7)
                </a>
              </div>

              <div style={{ marginTop: '4px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Grievance & Support Desk
                </span>
                <a
                  href={`mailto:${LEGAL_CONFIG.contact.supportEmail}`}
                  title="Contact Support"
                  style={{ color: 'var(--accent-forest, #245741)', fontWeight: 600, textDecoration: 'none' }}
                >
                  ✉️ {LEGAL_CONFIG.contact.supportEmail}
                </a>
              </div>

              <div style={{ marginTop: '2px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                DPO: {LEGAL_CONFIG.grievanceOfficer.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '24px' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '900px', marginInline: 'auto', textAlign: 'center' }}>
          <strong>Clinical Disclaimer:</strong> {LEGAL_CONFIG.clinicalDisclaimer}
        </p>
        <p style={{ margin: 0, fontSize: '0.82rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          © {currentYear} {LEGAL_CONFIG.legalEntityName}. All rights reserved under the laws of the Republic of India.
        </p>
      </div>
    </footer>
  );
}
