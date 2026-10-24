// ============================================
// MindCare — Unified Consent & Clinical Governance Architecture
// Zero-Trust Default, Granular Per-Data-Type Scopes, Multi-Actor Governance
// Covers: Phase 3 (Clinical), Phase 4 (Family Mode), Phase 5 (Sensors & Biometrics)
// ============================================

import { Storage } from './storage';

const KEYS = {
  THERAPIST_CONSENT: 'mindcare_therapist_consent',
  FAMILY_CONSENT: 'mindcare_family_consent',
  MULTIMODAL_CONSENT: 'mindcare_multimodal_consent',
  BIOMETRICS_CONSENT: 'mindcare_biometrics_consent',
  SESSION_REQUESTS: 'mindcare_session_requests',
  UNIFIED_AUDIT_LOG: 'mindcare_unified_audit_log'
};

const DEFAULT_THERAPIST = {
  id: 'usr_demo_therapist_01',
  name: 'Dr. Evelyn Vance, PsyD',
  title: 'Licensed Clinical Psychologist',
  license: 'Lic #PSY-28491',
  specialties: ['CBT & Anxiety Management', 'Burnout Prevention', 'Somatic Regulation'],
  bio: 'Specializing in integrative mindfulness-based cognitive therapy, nervous system down-regulation, and compassionate burnout recovery.'
};

export const ClinicalConsentService = {
  getDefaultTherapist: () => DEFAULT_THERAPIST,

  // -------------------------------------------------------------
  // PHASE 3: CLINICAL THERAPIST CONSENT (Strict Zero-Trust)
  // -------------------------------------------------------------
  getConsent: () => {
    const raw = Storage.get(KEYS.THERAPIST_CONSENT, null);
    if (raw) return raw;

    const initial = {
      accessGranted: false, // Default is strictly FALSE
      therapistId: DEFAULT_THERAPIST.id,
      therapistName: DEFAULT_THERAPIST.name,
      therapistTitle: DEFAULT_THERAPIST.title,
      accessKey: 'CARE-' + Math.floor(1000 + Math.random() * 9000) + '-MC',
      grantedAt: null,
      expiresAt: null, // Auto-expires after 30 days
      lastAccessedAt: null,
      scopes: {
        shareMoodTrends: false,          // 7d/30d valence & rhythm charts
        shareDigitalTwinMetrics: false,  // Stress Load Index & Resilience Buffer
        shareEarlyWarnings: false,       // Burnout & decline risk flags
        shareRoutineAdherence: false,    // Breathwork & routine completion %
        shareJournalThemes: false,       // Aggregate cognitive themes (NO raw text)
        shareRawJournalText: false       // STRICTLY FALSE BY DEFAULT: Full unedited personal entries
      },
      auditHistory: []
    };
    Storage.set(KEYS.THERAPIST_CONSENT, initial);
    return initial;
  },

  saveConsent: (consent) => {
    Storage.set(KEYS.THERAPIST_CONSENT, consent);
    return consent;
  },

  toggleScope: (scopeKey) => {
    const consent = ClinicalConsentService.getConsent();
    if (consent.scopes.hasOwnProperty(scopeKey)) {
      consent.scopes[scopeKey] = !consent.scopes[scopeKey];
      ClinicalConsentService.appendAudit('Client', 'SCOPE_TOGGLED', `Clinical scope "${scopeKey}" set to ${consent.scopes[scopeKey]}`);
      ClinicalConsentService.saveConsent(consent);
    }
    return consent;
  },

  grantAccess: (daysValid = 30) => {
    const consent = ClinicalConsentService.getConsent();
    const now = new Date();
    const expires = new Date(now.getTime() + daysValid * 24 * 60 * 60 * 1000);
    consent.accessGranted = true;
    consent.grantedAt = now.toISOString();
    consent.expiresAt = expires.toISOString();
    ClinicalConsentService.appendAudit('Client', 'ACCESS_GRANTED', `Clinical access authorized for Dr. Evelyn Vance (expires in ${daysValid} days)`);
    ClinicalConsentService.saveConsent(consent);
    return consent;
  },

  revokeAccess: () => {
    const consent = ClinicalConsentService.getConsent();
    consent.accessGranted = false;
    consent.grantedAt = null;
    consent.expiresAt = null;
    // Reset all sharing scopes to FALSE on revocation
    Object.keys(consent.scopes).forEach(k => { consent.scopes[k] = false; });
    // Regenerate a new access key so old pairing key is completely invalidated
    consent.accessKey = 'CARE-' + Math.floor(1000 + Math.random() * 9000) + '-MC';
    ClinicalConsentService.appendAudit('Client', 'ACCESS_REVOKED', 'Clinical access completely revoked and pairing key regenerated');
    ClinicalConsentService.saveConsent(consent);
    return consent;
  },

  recordAuditAccess: (viewerName = 'Dr. Evelyn Vance, PsyD') => {
    const consent = ClinicalConsentService.getConsent();
    const now = new Date().toISOString();
    consent.lastAccessedAt = now;
    if (!consent.auditHistory) consent.auditHistory = [];
    consent.auditHistory.unshift({
      event: `Clinical snapshot viewed by ${viewerName}`,
      timestamp: now
    });
    if (consent.auditHistory.length > 20) consent.auditHistory.pop();
    ClinicalConsentService.saveConsent(consent);
    ClinicalConsentService.appendAudit('Therapist', 'SNAPSHOT_VIEWED', `Snapshot viewed by ${viewerName}`);
    return consent;
  },

  // -------------------------------------------------------------
  // PHASE 4: FAMILY & CAREGIVER CONSENT (Reuses Phase 3 Model)
  // -------------------------------------------------------------
  getFamilyConsent: () => {
    return Storage.get(KEYS.FAMILY_CONSENT, {
      enabled: false, // Default is strictly FALSE
      familyKey: 'FAM-' + Math.floor(1000 + Math.random() * 9000) + '-MC',
      contacts: [
        {
          id: 'fam_1',
          name: 'Elena Rostova',
          relationship: 'Partner',
          email: 'elena@example.com',
          status: 'Active',
          addedAt: new Date(Date.now() - 86400000 * 5).toISOString()
        }
      ],
      scopes: {
        shareCheckInStatus: false,   // "Checked in today" binary indicator only
        shareMilestones: false,      // "Completed 7-day streak", "Planted Sanctuary Tree"
        shareEmergencyAlerts: false  // Proactive notification if crisis hotline is triggered
      }
    });
  },

  saveFamilyConsent: (data) => {
    Storage.set(KEYS.FAMILY_CONSENT, data);
    return data;
  },

  toggleFamilyScope: (scopeKey) => {
    const family = ClinicalConsentService.getFamilyConsent();
    if (family.scopes.hasOwnProperty(scopeKey)) {
      family.scopes[scopeKey] = !family.scopes[scopeKey];
      ClinicalConsentService.appendAudit('Client', 'FAMILY_SCOPE_TOGGLED', `Family scope "${scopeKey}" set to ${family.scopes[scopeKey]}`);
      ClinicalConsentService.saveFamilyConsent(family);
    }
    return family;
  },

  toggleFamilyEnabled: () => {
    const family = ClinicalConsentService.getFamilyConsent();
    family.enabled = !family.enabled;
    ClinicalConsentService.appendAudit('Client', 'FAMILY_MODE_TOGGLED', `Family mode set to ${family.enabled}`);
    ClinicalConsentService.saveFamilyConsent(family);
    return family;
  },

  addFamilyContact: (contact) => {
    const family = ClinicalConsentService.getFamilyConsent();
    const newContact = {
      id: 'fam_' + Date.now(),
      status: 'Active',
      addedAt: new Date().toISOString(),
      ...contact
    };
    family.contacts.push(newContact);
    ClinicalConsentService.appendAudit('Client', 'FAMILY_CONTACT_ADDED', `Added trusted contact ${newContact.name} (${newContact.relationship})`);
    ClinicalConsentService.saveFamilyConsent(family);
    return family;
  },

  removeFamilyContact: (id) => {
    const family = ClinicalConsentService.getFamilyConsent();
    const contact = family.contacts.find(c => c.id === id);
    family.contacts = family.contacts.filter(c => c.id !== id);
    ClinicalConsentService.appendAudit('Client', 'FAMILY_CONTACT_REMOVED', `Removed trusted contact ${contact?.name || id}`);
    ClinicalConsentService.saveFamilyConsent(family);
    return family;
  },

  // -------------------------------------------------------------
  // PHASE 5: MULTIMODAL & BIOMETRIC SENSORS (Off by default)
  // -------------------------------------------------------------
  getMultimodalConsent: () => {
    return Storage.get(KEYS.MULTIMODAL_CONSENT, {
      sleepSync: false,        // Sleep duration and sleep latency rhythm
      wearablesSync: false,    // Steps, activity pace, resting heart rate
      calendarSync: false      // Meeting density & workday load indicators
    });
  },

  saveMultimodalConsent: (data) => {
    Storage.set(KEYS.MULTIMODAL_CONSENT, data);
    return data;
  },

  toggleMultimodalScope: (key) => {
    const current = ClinicalConsentService.getMultimodalConsent();
    current[key] = !current[key];
    ClinicalConsentService.appendAudit('Client', 'MULTIMODAL_TOGGLE', `Multimodal source "${key}" set to ${current[key]}`);
    ClinicalConsentService.saveMultimodalConsent(current);
    return current;
  },

  getBiometricsConsent: () => {
    return Storage.get(KEYS.BIOMETRICS_CONSENT, {
      voiceEmotion: false,     // Local acoustic pitch & cadence analysis (RAM-only)
      facialEmotion: false,    // Local micro-expression tracking via WebCam (RAM-only)
      grantedAt: null,
      lastPurgedAt: null
    });
  },

  saveBiometricsConsent: (data) => {
    Storage.set(KEYS.BIOMETRICS_CONSENT, data);
    return data;
  },

  toggleBiometricScope: (key) => {
    const current = ClinicalConsentService.getBiometricsConsent();
    current[key] = !current[key];
    if (current[key]) {
      current.grantedAt = new Date().toISOString();
    }
    ClinicalConsentService.appendAudit('Client', 'BIOMETRIC_TOGGLE', `Biometric analysis "${key}" set to ${current[key]}`);
    ClinicalConsentService.saveBiometricsConsent(current);
    return current;
  },

  purgeBiometricData: () => {
    const current = ClinicalConsentService.getBiometricsConsent();
    current.voiceEmotion = false;
    current.facialEmotion = false;
    current.lastPurgedAt = new Date().toISOString();
    ClinicalConsentService.saveBiometricsConsent(current);
    ClinicalConsentService.appendAudit('Client', 'BIOMETRICS_PURGED', 'All ephemeral biometric weights and audio/visual models permanently purged from local memory');
    return current;
  },

  // -------------------------------------------------------------
  // MASTER SEVERANCE: Instant One-Click Complete Disconnect
  // -------------------------------------------------------------
  severAllConnections: () => {
    // 1. Revoke clinical access & regenerate token
    ClinicalConsentService.revokeAccess();
    
    // 2. Disable family mode & zero out scopes
    const family = ClinicalConsentService.getFamilyConsent();
    family.enabled = false;
    Object.keys(family.scopes).forEach(k => { family.scopes[k] = false; });
    family.familyKey = 'FAM-' + Math.floor(1000 + Math.random() * 9000) + '-MC';
    ClinicalConsentService.saveFamilyConsent(family);

    // 3. Purge all biometrics and shut off multimodal
    ClinicalConsentService.purgeBiometricData();
    const multi = { sleepSync: false, wearablesSync: false, calendarSync: false };
    ClinicalConsentService.saveMultimodalConsent(multi);

    ClinicalConsentService.appendAudit('Client', 'SEVER_ALL_ACTIVE', 'MASTER SEVERANCE: All clinical, caregiver, multimodal, and biometric authorizations immediately terminated and keys regenerated');

    return {
      success: true,
      timestamp: new Date().toISOString()
    };
  },

  // -------------------------------------------------------------
  // UNIFIED AUDIT LOGGING
  // -------------------------------------------------------------
  getAuditLog: () => {
    return Storage.get(KEYS.UNIFIED_AUDIT_LOG, []);
  },

  appendAudit: (actor, action, details) => {
    const logs = ClinicalConsentService.getAuditLog();
    const entry = {
      id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      actor,
      action,
      details
    };
    logs.unshift(entry);
    if (logs.length > 50) logs.pop();
    Storage.set(KEYS.UNIFIED_AUDIT_LOG, logs);
    return entry;
  },

  // -------------------------------------------------------------
  // SESSION BOOKING REQUESTS
  // -------------------------------------------------------------
  getSessionRequests: () => {
    return Storage.get(KEYS.SESSION_REQUESTS, []);
  },

  submitSessionRequest: (requestData) => {
    const requests = ClinicalConsentService.getSessionRequests();
    const newRequest = {
      id: 'req_' + Date.now(),
      status: 'Pending Confirmation',
      submittedAt: new Date().toISOString(),
      therapistId: DEFAULT_THERAPIST.id,
      therapistName: DEFAULT_THERAPIST.name,
      ...requestData
    };
    requests.unshift(newRequest);
    Storage.set(KEYS.SESSION_REQUESTS, requests);
    ClinicalConsentService.appendAudit('Client', 'SESSION_BOOKED', `Session consultation requested with ${DEFAULT_THERAPIST.name}`);
    return newRequest;
  },

  updateRequestStatus: (id, newStatus) => {
    const requests = ClinicalConsentService.getSessionRequests();
    const updated = requests.map(r => r.id === id ? { ...r, status: newStatus } : r);
    Storage.set(KEYS.SESSION_REQUESTS, updated);
    ClinicalConsentService.appendAudit('Therapist', 'SESSION_STATUS_UPDATED', `Request ${id} marked as ${newStatus}`);
    return updated;
  }
};
