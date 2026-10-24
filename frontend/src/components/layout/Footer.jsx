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
            <Link to="/crisis" className="crisis-link-text">{UI_STRINGS.footer.crisisLink}</Link>
            <Link to="/settings">{UI_STRINGS.footer.privacyLink}</Link>
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
