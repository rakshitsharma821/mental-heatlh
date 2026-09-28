import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="sanctuary-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">✦ MindCare</div>
          <p className="footer-sub">Heal slowly. Rise stronger. Your confidential, client-side mental wellness sanctuary.</p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>Sanctuary</h4>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/breathing">3D Breathwork</Link>
            <Link to="/mood">Mood Rhythm</Link>
            <Link to="/journal">Private Journal</Link>
          </div>
          <div className="footer-col">
            <h4>Safety & Ethics</h4>
            <Link to="/crisis" className="crisis-link-text">🛡️ Emergency Crisis Support</Link>
            <Link to="/settings">🔒 Privacy & Data Controls</Link>
            <span className="privacy-badge">100% Offline & Local Storage</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} MindCare. Crafted with care for mental health and gentle restoration.</p>
      </div>
    </footer>
  );
}
