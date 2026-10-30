// ============================================
// MindCare Sanctuary — Unified Navigation Bar
// Single consistent row, interactive Settings Dropdown, SVG icons, responsive
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UI_STRINGS } from '../../config/strings';

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
    { to: '/dashboard', label: UI_STRINGS.nav.dashboard },
    { to: '/mood', label: UI_STRINGS.nav.mood },
    { to: '/breathing', label: UI_STRINGS.nav.breathing },
    { to: '/journal', label: 'Journal' },
    { to: '/routine', label: UI_STRINGS.nav.routine },
    { to: '/progress', label: UI_STRINGS.nav.progress },
    { to: '/community', label: UI_STRINGS.nav.community },
    { to: '/games', label: UI_STRINGS.nav.games }
  ];

  return (
    <nav className="sanctuary-nav">
      <div className="nav-container">
        {/* Brand Logo */}
        <Link to={!user ? "/" : (user.role === 'admin' || user.role === 'super_admin' ? "/admin" : (user.role === 'therapist' ? "/therapist" : "/dashboard"))} className="nav-logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-sparkle">{UI_STRINGS.brand.sparkle}</span>
          <span className="logo-text">{UI_STRINGS.brand.name}</span>
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
              {/* THERAPIST ROLE: Clean dedicated header without client links */}
              {user.role === 'therapist' ? (
                <>
                  <div className="nav-links-cluster" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <NavLink
                      to="/therapist"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                      style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Clinician Workspace</span>
                    </NavLink>
                    <NavLink
                      to="/clinical"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                      style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Clinical Records</span>
                    </NavLink>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      backgroundColor: 'rgba(82, 183, 136, 0.15)',
                      color: '#2d6a4f',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#52b788' }}></span>
                      Clinician Portal
                    </span>
                  </div>

                  {/* Therapist Action Cluster */}
                  <div className="nav-actions-cluster" style={{ position: 'relative' }}>
                    {/* Settings & Privacy Gear Button */}
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
                            <div className="settings-avatar-circle" style={{ backgroundColor: '#2b5f7d', color: '#fff' }}>
                              {(user.name || 'T')[0].toUpperCase()}
                            </div>
                            <div className="settings-user-info">
                              <strong className="settings-user-name">{user.name || 'Therapist'}</strong>
                              <span className="settings-user-email">{user.email}</span>
                              <span className="settings-user-badge" style={{ backgroundColor: 'rgba(43, 95, 125, 0.12)', color: '#2b5f7d' }}>
                                Role: Clinician
                              </span>
                            </div>
                          </div>
                          <div className="settings-drop-divider"></div>
                          <div className="settings-drop-links">
                            <button
                              type="button"
                              className="settings-drop-item"
                              onClick={() => { setSettingsOpen(false); navigate('/settings'); }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              <span>Privacy & DPDP Security</span>
                            </button>
                            <button
                              type="button"
                              className="settings-drop-item"
                              onClick={() => { setSettingsOpen(false); navigate('/clinical'); }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <polyline points="16 11 18 13 22 9" />
                              </svg>
                              <span>Clinical Consent & Oversight</span>
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

                    <button 
                      className="nav-btn-logout" 
                      onClick={handleLogout}
                      title="Sign out of clinician workspace"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px', pointerEvents: 'none' }}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (user.role === 'admin' || user.role === 'super_admin') ? (
                /* ADMIN ROLE: Clean dedicated header without client links */
                <>
                  <div className="nav-links-cluster" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <NavLink
                      to="/admin"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                      style={{ fontWeight: 700, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Administrative Control Console</span>
                    </NavLink>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      backgroundColor: 'rgba(124, 58, 237, 0.12)',
                      color: '#6d28d9',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}>
                      System Admin
                    </span>
                  </div>

                  {/* Admin Action Cluster */}
                  <div className="nav-actions-cluster">
                    <button 
                      className="nav-btn-logout" 
                      onClick={handleLogout}
                      title="Sign out of administration console"
                      style={{ borderColor: '#7c3aed', color: '#7c3aed' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px', pointerEvents: 'none' }}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                /* REGULAR CLIENT ROLE: Standard Sanctuary navigation */
                <>
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

                    {/* Settings & Privacy Gear Button */}
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
                              <strong className="settings-user-name">{user.name || 'Sanctuary User'}</strong>
                              <span className="settings-user-email">{user.email}</span>
                              <span className="settings-user-badge">
                                Role: Sanctuary Member
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
                                navigate('/settings');
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                              </svg>
                              <span>Mindful Notifications & Quiet Hours</span>
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

                    {/* Logout Button */}
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
                </>
              )}
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
              <Link to="/login?portal=therapist" className="nav-link" onClick={() => setMenuOpen(false)} title="Therapist Portal Login" style={{ color: '#2b5f7d', fontWeight: 600 }}>
                Therapist
              </Link>
              <Link to="/login?portal=admin" className="nav-link" onClick={() => setMenuOpen(false)} title="Admin Console Login" style={{ color: '#8e44ad', fontWeight: 600 }}>
                Admin
              </Link>
              <Link to="/login?portal=member" className="nav-link" onClick={() => setMenuOpen(false)}>
                User Log In
              </Link>
              <Link to="/register" className="nav-btn-primary" onClick={() => setMenuOpen(false)}>
                Begin Sanctuary
              </Link>
            </div>
          )}
        </div>
      </div>
      {menuOpen && (
        <div
          className="nav-mobile-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}
