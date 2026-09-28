// ============================================
// MindCare Sanctuary — Unified Navigation Bar
// Single consistent row, interactive Settings Dropdown, SVG icons, responsive
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout, switchRole } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    setSettingsOpen(false);
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen]);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/mood', label: 'Mood' },
    { to: '/breathing', label: 'Breathing' },
    { to: '/journal', label: 'Journal' },
    { to: '/routine', label: 'Routine' },
    { to: '/progress', label: 'Progress' },
    { to: '/community', label: 'Community' },
    { to: '/games', label: 'Games' }
  ];

  return (
    <nav className="sanctuary-nav">
      <div className="nav-container">
        {/* Brand Logo */}
        <Link to={user ? "/dashboard" : "/"} className="nav-logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-sparkle">✦</span>
          <span className="logo-text">MindCare</span>
        </Link>

        {/* Mobile Hamburger Toggle */}
        <button 
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation Menu */}
        <div className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          {user ? (
            <div className="nav-inner-row">
              {/* Primary Feature Links */}
              <div className="nav-links-cluster">
                {navLinks.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>

              {/* Action & Utility Group */}
              <div className="nav-actions-cluster" style={{ position: 'relative' }}>
                {/* Clinical Portal */}
                <NavLink
                  to="/clinical"
                  className={({ isActive }) => `nav-link clinical-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                  title="Therapist & Clinical Oversight Portal"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', pointerEvents: 'none' }}>
                    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                    <circle cx="20" cy="10" r="2" />
                  </svg>
                  <span>Clinical</span>
                </NavLink>

                {/* Safety-Critical SOS / Crisis Pill */}
                <NavLink
                  to="/crisis"
                  className={({ isActive }) => `nav-link crisis-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                  title="Immediate 24/7 Crisis Help & Safety Plan"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>SOS / Help</span>
                </NavLink>

                {/* Settings & Privacy Gear Button (Opens Interactive Modal/Dropdown) */}
                <div style={{ position: 'relative' }} ref={settingsRef}>
                  <button
                    type="button"
                    className={`nav-icon-btn ${settingsOpen ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSettingsOpen(prev => !prev);
                    }}
                    title="Account & Privacy Settings"
                    aria-label="Settings"
                    aria-expanded={settingsOpen}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </button>

                  {/* Settings Dropdown Popover */}
                  {settingsOpen && (
                    <div className="nav-settings-dropdown">
                      <div className="settings-drop-header">
                        <div className="settings-avatar-circle">
                          {(user.name || 'M')[0].toUpperCase()}
                        </div>
                        <div className="settings-user-info">
                          <strong className="settings-user-name">{user.name || 'Sanctuary Member'}</strong>
                          <span className="settings-user-email">{user.email}</span>
                          <span className="settings-user-badge">
                            Role: {user.role === 'therapist' ? '🩺 Therapist' : '🌿 Client'}
                          </span>
                        </div>
                      </div>

                      <div className="settings-drop-divider"></div>

                      <div className="settings-drop-links">
                        <button
                          type="button"
                          className="settings-drop-item"
                          onClick={() => {
                            setSettingsOpen(false);
                            navigate('/settings');
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <span>Privacy & Data Sovereignty</span>
                        </button>

                        <button
                          type="button"
                          className="settings-drop-item"
                          onClick={() => {
                            setSettingsOpen(false);
                            navigate('/clinical');
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <polyline points="16 11 18 13 22 9" />
                          </svg>
                          <span>Clinical Consent & Oversight</span>
                        </button>

                        <button
                          type="button"
                          className="settings-drop-item"
                          onClick={() => {
                            setSettingsOpen(false);
                            navigate('/crisis');
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          <span>Crisis Helplines & Safety Plan</span>
                        </button>

                        <button
                          type="button"
                          className="settings-drop-item"
                          onClick={() => {
                            const newRole = user.role === 'therapist' ? 'client' : 'therapist';
                            switchRole(newRole);
                            setSettingsOpen(false);
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="17 1 21 5 17 9" />
                            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                            <polyline points="7 23 3 19 7 15" />
                            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                          </svg>
                          <span>Switch Role ({user.role === 'therapist' ? 'to Client' : 'to Therapist'})</span>
                        </button>
                      </div>

                      <div className="settings-drop-divider"></div>

                      <button
                        type="button"
                        className="settings-drop-item settings-drop-logout"
                        onClick={handleLogout}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Sign Out of MindCare</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Polished Logout Button */}
                <button 
                  className="nav-btn-logout" 
                  onClick={handleLogout}
                  title="Sign out of sanctuary"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px', pointerEvents: 'none' }}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="nav-logged-out-row">
              <Link 
                to="/crisis" 
                className="nav-link crisis-pill" 
                onClick={() => setMenuOpen(false)}
                title="Immediate 24/7 Crisis Help"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Crisis Help</span>
              </Link>
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>
                Log In
              </Link>
              <Link to="/register" className="nav-btn-primary" onClick={() => setMenuOpen(false)}>
                Begin Sanctuary
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
