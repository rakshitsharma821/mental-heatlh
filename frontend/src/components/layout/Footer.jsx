import React from 'react';
import { Link } from 'react-router-dom';
import { UI_STRINGS } from '../../config/strings';

export default function Footer() {
  return (
    <footer className="sanctuary-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">{UI_STRINGS.brand.sparkle} {UI_STRINGS.brand.name}</div>
          <p className="footer-sub">{UI_STRINGS.brand.subtext}</p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>{UI_STRINGS.footer.sanctuaryHeading}</h4>
            <Link to="/dashboard">{UI_STRINGS.nav.dashboard}</Link>
            <Link to="/breathing">{UI_STRINGS.nav.breathing}</Link>
            <Link to="/mood">{UI_STRINGS.nav.mood}</Link>
            <Link to="/routine">{UI_STRINGS.nav.routine}</Link>
          </div>
          <div className="footer-col">
            <h4>{UI_STRINGS.footer.safetyHeading}</h4>
            <Link to="/crisis" className="crisis-link-text" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <svg width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-0.15em', marginRight: '6px', flexShrink: 0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>{UI_STRINGS.footer.crisisLink}</span>
            </Link>
            <Link to="/settings" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <svg width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-0.15em', marginRight: '6px', flexShrink: 0 }}>
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>{UI_STRINGS.footer.privacyLink}</span>
            </Link>
            <span className="privacy-badge">{UI_STRINGS.footer.privacyBadge}</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>{UI_STRINGS.brand.copyright()}</p>
      </div>
    </footer>
  );
}
