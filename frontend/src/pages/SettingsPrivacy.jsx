import React, { useState, useEffect } from 'react';
import { Storage } from '../services/storage';
import { ClinicalConsentService } from '../services/clinicalConsent';
import { Api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function SettingsPrivacy() {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState({
    moodsCount: 0,
    journalsCount: 0,
    routinesCount: 0,
    chatMessagesCount: 0,
    hasSafetyPlan: false,
    accountEmail: ''
  });

  const [consent, setConsent] = useState({
    aiPersonalizationConsent: true,
    journalReflectionConsent: true,
    analyticsConsent: true
  });

  const [clinicalConsent, setClinicalConsent] = useState(ClinicalConsentService.getConsent());
  const [familyConsent, setFamilyConsent] = useState(ClinicalConsentService.getFamilyConsent());
  const [multimodalConsent, setMultimodalConsent] = useState(ClinicalConsentService.getMultimodalConsent());
  const [biometricsConsent, setBiometricsConsent] = useState(ClinicalConsentService.getBiometricsConsent());
  const [auditLog, setAuditLog] = useState(ClinicalConsentService.getAuditLog());

  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [severSuccessNotice, setSeverSuccessNotice] = useState(false);
  const [biometricPurgeNotice, setBiometricPurgeNotice] = useState(false);

  // New family contact input state
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('Partner');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Part 7: Opt-in Notifications & Quiet Hours state
  const [notifPrefs, setNotifPrefs] = useState({
    optIn: false,
    consentTimestamp: null,
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    sessionUpdates: true,
    reminders: true,
    therapistVerificationUpdates: true
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifNotice, setNotifNotice] = useState('');
  const [consentAuditList, setConsentAuditList] = useState([]);
  const [showConsentHistory, setShowConsentHistory] = useState(false);

  // Motion Comfort & Sensory Accessibility
  const [reduceMotion, setReduceMotion] = useState(() => {
    try {
      return Storage.get('mindcare_reduce_motion', false) || localStorage.getItem('mindcare_reduce_motion') === 'true';
    } catch (_) {
      return false;
    }
  });

  const handleToggleReduceMotion = () => {
    const next = !reduceMotion;
    setReduceMotion(next);
    Storage.set('mindcare_reduce_motion', next);
    try {
      localStorage.setItem('mindcare_reduce_motion', String(next));
      if (document.documentElement) {
        document.documentElement.classList.toggle('user-reduced-motion', next);
      }
      window.dispatchEvent(new CustomEvent('mindcare-motion-preference-changed', { detail: { reduceMotion: next } }));
    } catch (_) {}
  };

  useEffect(() => {
    setInventory(Storage.getDataInventory());
    setConsent(Storage.getPrivacyConsent());
    setClinicalConsent(ClinicalConsentService.getConsent());
    setFamilyConsent(ClinicalConsentService.getFamilyConsent());
    setMultimodalConsent(ClinicalConsentService.getMultimodalConsent());
    setBiometricsConsent(ClinicalConsentService.getBiometricsConsent());
    setAuditLog(ClinicalConsentService.getAuditLog());

    // Load Part 7 Notification Preferences
    Api.getNotificationPreferences().then(res => {
      if (res && res.success && res.preferences) {
        setNotifPrefs(res.preferences);
      }
    });
  }, [user]);

  const handleToggleNotifOptIn = async () => {
    setNotifLoading(true);
    const updated = { ...notifPrefs, optIn: !notifPrefs.optIn };
    const res = await Api.updateNotificationPreferences(updated);
    setNotifLoading(false);
    if (res && res.success && res.preferences) {
      setNotifPrefs(res.preferences);
      setNotifNotice(res.message);
      setTimeout(() => setNotifNotice(''), 4000);
    }
  };

  const handleUpdateNotifPrefs = async (key, value) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    const res = await Api.updateNotificationPreferences(updated);
    if (res && res.success && res.preferences) {
      setNotifPrefs(res.preferences);
    }
  };

  const loadConsentHistory = async () => {
    if (!showConsentHistory) {
      const res = await Api.getNotificationConsentAudit();
      if (res && res.success && res.consentHistory) {
        setConsentAuditList(res.consentHistory);
      }
    }
    setShowConsentHistory(!showConsentHistory);
  };

  const handleToggleConsent = (key) => {
    const updated = { ...consent, [key]: !consent[key] };
    setConsent(updated);
    Storage.savePrivacyConsent(updated);
  };

  const handleToggleScope = (scopeKey) => {
    const updated = ClinicalConsentService.toggleScope(scopeKey);
    setClinicalConsent({ ...updated });
    setAuditLog(ClinicalConsentService.getAuditLog());
  };

  const handleGrantAccess = () => {
    const updated = ClinicalConsentService.grantAccess();
    setClinicalConsent({ ...updated });
    setAuditLog(ClinicalConsentService.getAuditLog());
  };

  const handleRevokeAccess = () => {
    const updated = ClinicalConsentService.revokeAccess();
    setClinicalConsent({ ...updated });
    setAuditLog(ClinicalConsentService.getAuditLog());
  };

  // Phase 4: Family Handlers
  const handleToggleFamilyEnabled = () => {
    const updated = ClinicalConsentService.toggleFamilyEnabled();
    setFamilyConsent({ ...updated });
    setAuditLog(ClinicalConsentService.getAuditLog());
  };

  const handleToggleFamilyScope = (scopeKey) => {
    const updated = ClinicalConsentService.toggleFamilyScope(scopeKey);
    setFamilyConsent({ ...updated });
    setAuditLog(ClinicalConsentService.getAuditLog());
  };

  const handleAddFamilyContact = (e) => {
    e.preventDefault();
    if (!newContactName.trim()) return;
    const updated = ClinicalConsentService.addFamilyContact({
      name: newContactName.trim(),
      relationship: newContactRelation,
      email: newContactEmail.trim()
    });
    setFamilyConsent({ ...updated });
    setNewContactName('');
    setNewContactEmail('');
    setAuditLog(ClinicalConsentService.getAuditLog());
  };

  const handleRemoveFamilyContact = (id) => {
    const updated = ClinicalConsentService.removeFamilyContact(id);
    setFamilyConsent({ ...updated });
    setAuditLog(ClinicalConsentService.getAuditLog());
  };

  // Phase 5: Multimodal & Biometric Handlers
  const handleToggleMultimodal = (key) => {
    const updated = ClinicalConsentService.toggleMultimodalScope(key);
    setMultimodalConsent({ ...updated });
    setAuditLog(ClinicalConsentService.getAuditLog());
  };

  const handleToggleBiometric = (key) => {
    const updated = ClinicalConsentService.toggleBiometricScope(key);
    setBiometricsConsent({ ...updated });
    setAuditLog(ClinicalConsentService.getAuditLog());
  };

  const handlePurgeBiometrics = () => {
    const updated = ClinicalConsentService.purgeBiometricData();
    setBiometricsConsent({ ...updated });
    setAuditLog(ClinicalConsentService.getAuditLog());
    setBiometricPurgeNotice(true);
    setTimeout(() => setBiometricPurgeNotice(false), 3500);
  };

  const handleSeverAll = () => {
    if (window.confirm('Sever all active connections? This will immediately revoke clinician access, reset family sharing, purge biometric calibration weights, and rotate all security pairing keys.')) {
      ClinicalConsentService.severAllConnections();
      setClinicalConsent(ClinicalConsentService.getConsent());
      setFamilyConsent(ClinicalConsentService.getFamilyConsent());
      setMultimodalConsent(ClinicalConsentService.getMultimodalConsent());
      setBiometricsConsent(ClinicalConsentService.getBiometricsConsent());
      setAuditLog(ClinicalConsentService.getAuditLog());
      setSeverSuccessNotice(true);
      setTimeout(() => setSeverSuccessNotice(false), 4000);
    }
  };

  const handleExportData = () => {
    Storage.exportAllData();
  };

  const handleExecuteWipe = () => {
    if (wipeConfirmText.trim().toLowerCase() === 'delete') {
      Storage.wipeAllData();
      logout();
      navigate('/');
    } else {
      alert('Please type "delete" to confirm full data erasure.');
    }
  };

  return (
    <div className="settings-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '840px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--primary-dark)', fontWeight: 700 }}>
            Ethics & Privacy Controls
          </span>
          <h1 style={{ fontSize: '2.4rem', marginTop: '6px', marginBottom: '8px', color: 'var(--text-primary)' }}>Privacy & Data Sovereignty</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            You own 100% of your wellness data. Inspect, export, or permanently erase your records anytime.
          </p>

          <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Current Profile Role:</span>
            <strong style={{ color: 'var(--primary-dark)', textTransform: 'capitalize' }}>{user?.role || 'Client'}</strong>
            <button
              onClick={() => switchRole(user?.role === 'therapist' ? 'client' : 'therapist')}
              className="btn-ghost"
              style={{ fontSize: '0.74rem', padding: '3px 10px', marginLeft: '6px' }}
            >
              Switch to {user?.role === 'therapist' ? 'Client View' : 'Therapist View'} ⇄
            </button>
          </div>
        </div>

        {/* SENSORY & MOTION ACCESSIBILITY CONTROLS */}
        <div className="glass-card" style={{ padding: '26px 30px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.3rem' }}></span>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Motion & Visual Comfort</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '18px' }}>
            Tailor animations and 3D graphics for vestibular comfort, sensory sensitivity, or device battery saving.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '16px 20px',
            gap: '16px'
          }}>
            <div>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.94rem' }}>Reduce Motion & Disable 3D</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                Replaces all WebGL 3D canvases and perspective mouse parallax with calming static gradient posters.
              </p>
            </div>
            <input
              type="checkbox"
              id="reduce-motion-toggle"
              checked={reduceMotion}
              onChange={handleToggleReduceMotion}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent-forest)' }}
              aria-label="Reduce Motion & Disable 3D"
            />
          </div>
        </div>

        {/* Local Storage Guarantee Banner */}
        <div className="glass-card" style={{
          padding: '24px',
          marginBottom: '32px',
          borderLeft: '4px solid var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ fontSize: '2.2rem' }}></div>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>Client-Side Offline Architecture</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              MindCare stores all journal entries, mood assessments, routines, and safety plans directly inside your browser's private local storage. No third-party ad networks, no tracking beacons, no remote servers.
            </p>
          </div>
        </div>

        {/* Real-time Data Inventory */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}> Stored Data Inventory</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Exact count of wellness records residing on this browser instance:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Mood Check-ins</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-dark)', marginTop: '4px' }}>{inventory.moodsCount}</div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Journal Reflections</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>{inventory.journalsCount}</div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Routine Habits</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2b5f7d', marginTop: '4px' }}>{inventory.routinesCount}</div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Companion Messages</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b07d3b', marginTop: '4px' }}>{inventory.chatMessagesCount}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button onClick={handleExportData} className="btn-primary" style={{ padding: '12px 24px' }}>
              Export All Data (.json) 
            </button>
          </div>
        </div>

        {/* CLINICAL DATA SHARING & THERAPIST ACCESS */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '32px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem', color: 'var(--primary)' }}></span>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Clinical Data Sharing & Therapist Access</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                Strictly zero-trust by default. Grant, customize, or revoke provider access anytime.
              </p>
            </div>
          </div>

          {/* Active Pairing Status & Access Key */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                  Designated Provider
                </span>
                <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {clinicalConsent.therapistName} ({clinicalConsent.therapistTitle})
                </h4>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '100px',
                  background: clinicalConsent.accessGranted ? 'rgba(82, 183, 136, 0.18)' : 'rgba(82, 121, 111, 0.12)',
                  color: clinicalConsent.accessGranted ? 'var(--primary-dark)' : 'var(--text-muted)'
                }}>
                  {clinicalConsent.accessGranted ? '● SHARING ENABLED' : '○ ACCESS RESTRICTED'}
                </span>
              </div>
            </div>

            <div style={{
              background: 'rgba(82, 183, 136, 0.08)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                  Your Confidential Clinical Access Key:
                </span>
                <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary-dark)', marginTop: '2px' }}>
                  {clinicalConsent.accessKey}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {!clinicalConsent.accessGranted ? (
                  <button
                    onClick={handleGrantAccess}
                    className="btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                  >
                    Activate Access Key 
                  </button>
                ) : (
                  <button
                    onClick={handleRevokeAccess}
                    style={{
                      background: 'rgba(220, 53, 69, 0.12)',
                      border: '1px solid rgba(220, 53, 69, 0.3)',
                      color: '#b91c1c',
                      padding: '8px 18px',
                      borderRadius: '100px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Revoke Access Immediately 
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Granular Per-Data-Type Scopes */}
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '14px' }}>
            Granular Data-Type Permissions:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>Share Mood Trends & Check-in Frequency</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Allows provider to view 7-day and 30-day emotional valence trajectories.</div>
              </div>
              <input
                type="checkbox"
                checked={clinicalConsent.scopes.shareMoodTrends}
                onChange={() => handleToggleScope('shareMoodTrends')}
                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>Share Digital Twin Clinical Vitals</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Includes Stress Load Index, Resilience Buffer, and Emotional Velocity slope.</div>
              </div>
              <input
                type="checkbox"
                checked={clinicalConsent.scopes.shareDigitalTwinMetrics}
                onChange={() => handleToggleScope('shareDigitalTwinMetrics')}
                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>Share Early Warning Indicator Flags</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Surfaces multi-signal flags (e.g. Burnout Drift, Chronic Tension) to your provider.</div>
              </div>
              <input
                type="checkbox"
                checked={clinicalConsent.scopes.shareEarlyWarnings}
                onChange={() => handleToggleScope('shareEarlyWarnings')}
                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>Share Journal Cognitive Themes (Aggregates Only)</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Exposes thematic tags (e.g. Self-Compassion, Anxiety) WITHOUT exposing raw personal text.</div>
              </div>
              <input
                type="checkbox"
                checked={clinicalConsent.scopes.shareJournalThemes}
                onChange={() => handleToggleScope('shareJournalThemes')}
                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'rgba(220, 53, 69, 0.06)', border: '1px solid rgba(220, 53, 69, 0.25)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#991b1b', fontWeight: 700 }}> Share Full Raw Journal Text (Strictly Optional)</div>
                <div style={{ fontSize: '0.78rem', color: '#7f1d1d' }}>Exposes your complete unedited reflections. Recommended to keep DISABLED.</div>
              </div>
              <input
                type="checkbox"
                checked={clinicalConsent.scopes.shareRawJournalText}
                onChange={() => handleToggleScope('shareRawJournalText')}
                style={{ width: '20px', height: '20px', accentColor: '#dc2626' }}
              />
            </label>
          </div>
        </div>

        {/* PHASE 4: FAMILY & CAREGIVER SANCTUARY MODE */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '32px', borderLeft: '4px solid #72a1bf' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>‍‍</span>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Caregiver & Family Sanctuary Mode</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                Reuses the Phase 3 consent model to share selected binary wellness markers with trusted family.
              </p>
            </div>

            <button
              onClick={handleToggleFamilyEnabled}
              className={familyConsent.enabled ? 'btn-primary' : 'btn-ghost'}
              style={{ fontSize: '0.82rem', padding: '8px 18px' }}
            >
              {familyConsent.enabled ? '● Family Mode Active' : '○ Enable Family Mode'}
            </button>
          </div>

          {familyConsent.enabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Family Pairing Key */}
              <div style={{
                background: 'rgba(114, 161, 191, 0.1)',
                border: '1px solid rgba(114, 161, 191, 0.3)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#2b5f7d', fontWeight: 700 }}>
                    Caregiver Pairing Token
                  </div>
                  <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 800, color: '#1d4a63', marginTop: '2px' }}>
                    {familyConsent.familyKey}
                  </div>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '380px' }}>
                  Share this token with trusted family members so they can link their caregiver portal.
                </span>
              </div>

              {/* Granular Family Scopes */}
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Granular Family Sharing Permissions:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Share Daily Check-In Indicator</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>A simple "Checked in today" signal (zero mood scores or raw ratings shared).</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={familyConsent.scopes.shareCheckInStatus}
                      onChange={() => handleToggleFamilyScope('shareCheckInStatus')}
                      style={{ width: '18px', height: '18px', accentColor: '#72a1bf' }}
                    />
                  </label>

                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Share Sanctuary Milestones</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>E.g. "Completed 7 days of mindfulness" or "Inner World Tree upgraded".</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={familyConsent.scopes.shareMilestones}
                      onChange={() => handleToggleFamilyScope('shareMilestones')}
                      style={{ width: '18px', height: '18px', accentColor: '#72a1bf' }}
                    />
                  </label>

                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'rgba(246, 189, 96, 0.1)', border: '1px solid rgba(246, 189, 96, 0.3)', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#b07d3b' }}>Notify on Safety Plan Emergency Triggers</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Sends an emergency notification to family if 988 or crisis hotlines are opened.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={familyConsent.scopes.shareEmergencyAlerts}
                      onChange={() => handleToggleFamilyScope('shareEmergencyAlerts')}
                      style={{ width: '18px', height: '18px', accentColor: '#b07d3b' }}
                    />
                  </label>
                </div>
              </div>

              {/* Trusted Contacts Manager */}
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Trusted Caregivers ({familyConsent.contacts.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                  {familyConsent.contacts.map(c => (
                    <div
                      key={c.id}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        padding: '12px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {c.name} <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--text-muted)' }}>({c.relationship})</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{c.email || 'No email specified'}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveFamilyContact(c.id)}
                        className="btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#b91c1c' }}
                      >
                        Remove 
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Contact Form */}
                <form onSubmit={handleAddFamilyContact} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Contact Name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    style={{ flex: 1, minWidth: '140px' }}
                    required
                  />
                  <select
                    className="input-field"
                    value={newContactRelation}
                    onChange={(e) => setNewContactRelation(e.target.value)}
                    style={{ width: '130px' }}
                  >
                    <option value="Partner">Partner</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Close Friend">Close Friend</option>
                    <option value="Caregiver">Caregiver</option>
                  </select>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="contact@family.com"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    style={{ flex: 1, minWidth: '160px' }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
                    Add Contact +
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* PHASE 5: MULTIMODAL & BIOMETRIC SENSOR GOVERNANCE */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '32px', borderLeft: '4px solid #d4a373' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}></span>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Multimodal & Biometric Sensor Governance</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                Combine contextual signals (sleep, movement, calendar) and optional ephemeral biometrics to refine mood forecast horizons.
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '100px', background: 'rgba(212, 163, 115, 0.15)', color: '#b07d3b' }}>
              OFF BY DEFAULT (ZERO SILENT SYNC)
            </span>
          </div>

          {/* Multimodal Contextual Streams */}
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Contextual Device Data Sources:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}> Sleep Latency & Duration Sync</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Reads local sleep cycle metrics to forecast morning emotional replenishment.</div>
              </div>
              <input
                type="checkbox"
                checked={multimodalConsent.sleepSync}
                onChange={() => handleToggleMultimodal('sleepSync')}
                style={{ width: '18px', height: '18px', accentColor: '#d4a373' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>⌚ Wearable Step Cadence & Resting Heart Rate</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Correlates somatic movement pace with autonomic stress down-regulation.</div>
              </div>
              <input
                type="checkbox"
                checked={multimodalConsent.wearablesSync}
                onChange={() => handleToggleMultimodal('wearablesSync')}
                style={{ width: '18px', height: '18px', accentColor: '#d4a373' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}> Workday Calendar Density & Meeting Load</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Estimates cognitive demand without inspecting meeting titles or participants.</div>
              </div>
              <input
                type="checkbox"
                checked={multimodalConsent.calendarSync}
                onChange={() => handleToggleMultimodal('calendarSync')}
                style={{ width: '18px', height: '18px', accentColor: '#d4a373' }}
              />
            </label>
          </div>

          {/* Ephemeral Biometrics Section */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(212, 163, 115, 0.08), rgba(255, 255, 255, 0.95))',
            border: '1px solid rgba(212, 163, 115, 0.3)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.98rem', color: '#8a5828', fontWeight: 700, margin: 0 }}>
                 Sensitive Biometric Emotion Recognition (RAM-Only)
              </h4>
              <button
                onClick={handlePurgeBiometrics}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '5px 12px', color: '#b91c1c', borderColor: 'rgba(220, 53, 69, 0.3)' }}
              >
                Purge All Biometric Weights 
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '16px' }}>
              <strong>Ephemeral Processing Guarantee:</strong> Microphone acoustic pitch and camera micro-expression frames are processed entirely in temporary browser memory (RAM) and discarded instantaneously. Zero audio recordings or video snapshots are saved to disk or transmitted to any server.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '10px 14px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}> Voice Valence & Acoustic Cadence Analysis</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Extracts vocal pace and vocal fatigue indicators locally during check-in.</div>
                </div>
                <input
                  type="checkbox"
                  checked={biometricsConsent.voiceEmotion}
                  onChange={() => handleToggleBiometric('voiceEmotion')}
                  style={{ width: '18px', height: '18px', accentColor: '#d4a373' }}
                />
              </label>

              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '10px 14px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}> Facial Micro-Expression & Affect Tracking</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Estimates subtle facial valence markers on-device. Frames immediately dropped.</div>
                </div>
                <input
                  type="checkbox"
                  checked={biometricsConsent.facialEmotion}
                  onChange={() => handleToggleBiometric('facialEmotion')}
                  style={{ width: '18px', height: '18px', accentColor: '#d4a373' }}
                />
              </label>
            </div>

            {biometricPurgeNotice && (
              <div style={{ marginTop: '12px', color: 'var(--primary-dark)', fontSize: '0.8rem', fontWeight: 600 }}>
                 Biometric calibration weights and models have been completely purged from memory.
              </div>
            )}
          </div>
        </div>

        {/* PART 7: MINDFUL NOTIFICATIONS & QUIET HOURS (STRICT OPT-IN) */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '32px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}></span>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Mindful Notifications & Quiet Hours</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', maxWidth: '640px' }}>
                Strictly <strong>OFF by default</strong>. MindCare Sanctuary respects your peace. No reminders, session status changes, or practitioner updates are ever sent without your explicit recorded consent.
              </p>
            </div>

            <button
              onClick={handleToggleNotifOptIn}
              disabled={notifLoading}
              className={notifPrefs.optIn ? 'btn-primary' : 'btn-ghost'}
              style={{ fontSize: '0.82rem', padding: '8px 20px', borderRadius: '100px' }}
            >
              {notifPrefs.optIn ? '● Notifications Enabled' : '○ Turned Off (Default Silence)'}
            </button>
          </div>

          {/* Consent Timestamp Banner */}
          <div style={{
            background: notifPrefs.optIn ? 'rgba(82, 183, 136, 0.1)' : 'rgba(82, 121, 111, 0.06)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                Consent Status & Timestamp
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: notifPrefs.optIn ? 'var(--primary-dark)' : 'var(--text-muted)', marginTop: '2px' }}>
                {notifPrefs.optIn && notifPrefs.consentTimestamp
                  ? ` Explicit consent granted on ${new Date(notifPrefs.consentTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`
                  : '○ Off by default: No consent recorded. All notification channels completely silenced.'}
              </div>
            </div>

            <button
              onClick={loadConsentHistory}
              className="btn-ghost"
              style={{ fontSize: '0.75rem', padding: '5px 12px' }}
            >
              {showConsentHistory ? 'Hide Audit Log ▲' : 'View Consent Audit Trail ▼'}
            </button>
          </div>

          {/* Consent History Accordion */}
          {showConsentHistory && (
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Immutable Notification Consent History (DPDP Verified)
              </div>
              {consentAuditList.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No audit events found yet.</div>
              ) : (
                consentAuditList.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontWeight: 600, color: a.action === 'opt_in' ? 'var(--primary-dark)' : '#b91c1c' }}>
                      [{a.action.toUpperCase()}] {a.action === 'opt_in' ? 'Consent Recorded' : 'Consent Revoked'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {new Date(a.consentTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Guarantees Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {/* Quiet Hours Card */}
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span></span>
                <h4 style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>Restorative Quiet Hours</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Routine notifications are held during restful sleep hours ({notifPrefs.quietHoursStart} - {notifPrefs.quietHoursEnd} IST).
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem' }}>
                <input
                  type="checkbox"
                  checked={notifPrefs.quietHoursEnabled}
                  disabled={!notifPrefs.optIn}
                  onChange={(e) => handleUpdateNotifPrefs('quietHoursEnabled', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <span>Enforce sleep quiet hours protection</span>
              </label>
            </div>

            {/* Questionnaire Focus Mode Shield */}
            <div style={{
              background: 'rgba(82, 183, 136, 0.06)',
              border: '1px solid rgba(82, 183, 136, 0.25)',
              borderRadius: '14px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span>‍</span>
                <h4 style={{ fontSize: '0.92rem', color: 'var(--primary-dark)' }}>Questionnaire Focus Shield</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Notifications are <strong>guaranteed silenced</strong> whenever you are in Questionnaire or clinical reflection mode to protect your mindful presence.
              </p>
              <div style={{ marginTop: '10px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                 SYSTEM-ENFORCED NON-DISTURB
              </div>
            </div>
          </div>

          {/* Category Controls (Only active when opted in) */}
          {notifPrefs.optIn && (
            <div>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
                Notification Sanctuary Channels:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Session Status Updates</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Receive gentle alerts when consultation requests are confirmed, declined, or rescheduled.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.sessionUpdates}
                    onChange={(e) => handleUpdateNotifPrefs('sessionUpdates', e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                </label>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Gentle Well-Being Reminders</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Calming daily invitations to breathe, ground, or log your evening rhythm.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.reminders}
                    onChange={(e) => handleUpdateNotifPrefs('reminders', e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                </label>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Practitioner & Verification Notices</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Updates regarding clinical credentialing and dossier reviews.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.therapistVerificationUpdates}
                    onChange={(e) => handleUpdateNotifPrefs('therapistVerificationUpdates', e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                </label>
              </div>
            </div>
          )}

          {notifNotice && (
            <div style={{ marginTop: '14px', color: 'var(--primary-dark)', fontSize: '0.82rem', fontWeight: 600 }}>
               {notifNotice}
            </div>
          )}
        </div>

        {/* Granular Consent Toggles */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}> Personalization & Consent Controls</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Control which local analyses Aria and the Care Wellness Coach are allowed to perform:
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'rgba(82, 183, 136, 0.08)', padding: '10px 14px', borderRadius: '10px', marginBottom: '24px', border: '1px solid var(--border-subtle)' }}>
             <strong>AI Personalization Privacy:</strong> Your first name is sent to an AI provider (OpenRouter) to personalize messages.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '2px' }}>Care Companion Tone Adaptation & Milestones</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Allows Aria to read recent mood states and streaks to adjust empathy and acknowledge achievements.
                </p>
              </div>
              <input
                type="checkbox"
                checked={consent.aiPersonalizationConsent}
                onChange={() => handleToggleConsent('aiPersonalizationConsent')}
                style={{ width: '22px', height: '22px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '2px' }}>Explainable Insights Generation</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Analyzes correlation between breathwork sessions and mood recovery.
                </p>
              </div>
              <input
                type="checkbox"
                checked={consent.journalReflectionConsent}
                onChange={() => handleToggleConsent('journalReflectionConsent')}
                style={{ width: '22px', height: '22px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Unified Clinical & Data Sovereignty Audit Trail */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px' }}> Governance & Access Audit Trail</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Immutable client-side log of every permission change and clinical view event.
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 50 actions logged locally</span>
          </div>

          {auditLog.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              No access events recorded yet. All data is securely locked.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {auditLog.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem'
                  }}
                >
                  <div>
                    <span style={{
                      fontWeight: 700,
                      color: log.actor === 'Therapist' ? 'var(--primary-dark)' : 'var(--text-primary)',
                      marginRight: '8px'
                    }}>
                      [{log.actor}]
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{log.details}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Master One-Click Severance */}
        <div className="glass-card" style={{
          padding: '28px 32px',
          marginBottom: '32px',
          border: '1px solid rgba(220, 53, 69, 0.25)',
          background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.04), rgba(255, 255, 255, 0.9))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#991b1b', marginBottom: '4px' }}>
                 Emergency Severance (One-Click Disconnect)
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '540px' }}>
                Immediately revoke clinician access, clear caregiver sharing keys, purge biometric weights, and regenerate fresh rotation tokens in a single action.
              </p>
            </div>
            <button
              onClick={handleSeverAll}
              style={{
                background: 'rgba(220, 53, 69, 0.12)',
                border: '1px solid rgba(220, 53, 69, 0.4)',
                color: '#991b1b',
                padding: '10px 20px',
                borderRadius: '100px',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              Sever All Active Connections 
            </button>
          </div>
          {severSuccessNotice && (
            <div style={{ marginTop: '12px', color: 'var(--primary-dark)', fontSize: '0.82rem', fontWeight: 600 }}>
               All clinical, family, and sensor links have been terminated. Fresh security keys regenerated.
            </div>
          )}
        </div>

        {/* Danger Zone: Nuclear Data Wipe */}
        <div className="glass-card" style={{ padding: '32px', borderColor: 'rgba(220, 53, 69, 0.3)' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#b91c1c', marginBottom: '6px' }}> Right to Be Forgotten (Data Wipe)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Permanently clear all data stored in this browser, including account login, journal entries, and safety plan. This cannot be undone.
          </p>

          {!showWipeModal ? (
            <button
              onClick={() => setShowWipeModal(true)}
              style={{
                background: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                color: '#b91c1c',
                padding: '12px 24px',
                borderRadius: '100px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Permanently Erase All Data 
            </button>
          ) : (
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
                Please confirm: Type <strong>delete</strong> below to completely wipe all local storage:
              </p>
              <input
                type="text"
                className="input-field"
                placeholder="type delete here"
                value={wipeConfirmText}
                onChange={(e) => setWipeConfirmText(e.target.value)}
                style={{ marginBottom: '14px', maxWidth: '300px' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleExecuteWipe}
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    padding: '10px 22px',
                    borderRadius: '100px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Confirm & Delete Everything
                </button>
                <button
                  onClick={() => setShowWipeModal(false)}
                  className="btn-ghost"
                  style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
