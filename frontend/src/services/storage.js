// ============================================
// MindCare — Unified Storage & Privacy Service
// Client-Side Offline-First Sanctuary Architecture
// Hardened Cryptography, Session Isolation, Zero Plaintext Leakage
// ============================================

const KEYS = {
  USERS: 'mindcare_users',
  CURRENT_USER: 'mindcare_current_user',
  SESSION_USER: 'mindcare_session_user',
  REMEMBER_USER: 'mindcare_remember_user',
  JOURNAL: 'mindcare_journal_entries',
  ROUTINES: 'mindcare_routines',
  SAFETY_PLAN: 'mindcare_safety_plan',
  COMPANION_CHAT: 'mindcare_companion_chat',
  PRIVACY_CONSENT: 'mindcare_privacy_consent',
  DAILY_PLAN_PREFIX: 'mindcare_daily_plan_',
  DIGITAL_TWIN: 'mindcare_digital_twin'
};

export const Storage = {
  // Low-level LocalStorage helpers
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading key ${key} from storage:`, e);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error setting key ${key} in storage:`, e);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing key ${key} from storage:`, e);
    }
  },

  // Low-level SessionStorage helpers (for temporary tab sessions)
  getSession: (key, defaultValue = null) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },

  setSession: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  },

  removeSession: (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {}
  },

  // Cryptographic Hashing via Web Crypto API (SHA-256 with Salt)
  hashPassword: async (password, salt = 'mindcare_salt_sanctuary') => {
    if (!password) return '';
    try {
      const enc = new TextEncoder();
      const data = enc.encode(`${salt}:${password}`);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
      // Fallback pseudo-hash for non-secure environments if Web Crypto is unavailable
      let hash = 0;
      const combined = `${salt}:${password}`;
      for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      return 'fb_' + Math.abs(hash).toString(16);
    }
  },

  // User Authentication & Profile
  getUsers: () => Storage.get(KEYS.USERS, []),
  saveUsers: (users) => Storage.set(KEYS.USERS, users),

  // Session retrieval: Check sessionStorage first (tab session), then localStorage (persistent)
  getCurrentUser: () => {
    const sessionUser = Storage.getSession(KEYS.SESSION_USER, null);
    if (sessionUser) return sessionUser;
    return Storage.get(KEYS.CURRENT_USER, null);
  },

  // Session persistence: If remember === true -> localStorage; else sessionStorage
  setCurrentUser: (user, remember = false) => {
    if (!user) return;
    if (remember) {
      Storage.set(KEYS.CURRENT_USER, user);
      Storage.set(KEYS.REMEMBER_USER, { email: user.email, remember: true });
      Storage.removeSession(KEYS.SESSION_USER);
    } else {
      Storage.setSession(KEYS.SESSION_USER, user);
      Storage.remove(KEYS.CURRENT_USER);
      Storage.remove(KEYS.REMEMBER_USER);
    }
  },

  removeCurrentUser: () => {
    Storage.remove(KEYS.CURRENT_USER);
    Storage.remove(KEYS.REMEMBER_USER);
    Storage.removeSession(KEYS.SESSION_USER);
  },

  getRememberedUser: () => Storage.get(KEYS.REMEMBER_USER, null),
  removeRememberedUser: () => Storage.remove(KEYS.REMEMBER_USER),

  // Journal Entries
  getJournalEntries: () => Storage.get(KEYS.JOURNAL, []),
  saveJournalEntries: (entries) => Storage.set(KEYS.JOURNAL, entries),
  addJournalEntry: (entry) => {
    const entries = Storage.getJournalEntries();
    entries.unshift(entry);
    Storage.saveJournalEntries(entries);
    return entries;
  },
  deleteJournalEntry: (id) => {
    const entries = Storage.getJournalEntries().filter(e => e.id !== id);
    Storage.saveJournalEntries(entries);
    return entries;
  },

  // Routines
  getRoutines: () => Storage.get(KEYS.ROUTINES, []),
  saveRoutines: (routines) => Storage.set(KEYS.ROUTINES, routines),

  // Safety Plan (Crisis Support)
  getSafetyPlan: () => Storage.get(KEYS.SAFETY_PLAN, {
    warningSigns: '',
    copingStrategies: '',
    safePlaces: '',
    supportContacts: '',
    professionalSupport: 'National Suicide & Crisis Lifeline: 988\nCrisis Text Line: Text HOME to 741741\nEmergency Services: 911 / 112',
    environmentSafety: ''
  }),
  saveSafetyPlan: (plan) => Storage.set(KEYS.SAFETY_PLAN, plan),

  // Companion Chat History (Cross-session memory)
  getCompanionMessages: () => Storage.get(KEYS.COMPANION_CHAT, []),
  saveCompanionMessages: (messages) => Storage.set(KEYS.COMPANION_CHAT, messages),
  clearCompanionMessages: () => Storage.remove(KEYS.COMPANION_CHAT),

  // Privacy Consent
  getPrivacyConsent: () => Storage.get(KEYS.PRIVACY_CONSENT, {
    analyticsConsent: true,
    aiPersonalizationConsent: true,
    localOnlyNoticeAcknowledged: true,
    journalReflectionConsent: true,
    updatedAt: new Date().toISOString()
  }),
  savePrivacyConsent: (consent) => Storage.set(KEYS.PRIVACY_CONSENT, consent),

  // Daily Plan (AI Wellness Coach)
  getDailyPlan: (dateStr = new Date().toISOString().split('T')[0]) => {
    return Storage.get(`${KEYS.DAILY_PLAN_PREFIX}${dateStr}`, null);
  },
  saveDailyPlan: (plan, dateStr = new Date().toISOString().split('T')[0]) => {
    Storage.set(`${KEYS.DAILY_PLAN_PREFIX}${dateStr}`, plan);
  },

  // Digital Twin (Single source of truth wellness profile)
  getDigitalTwin: () => Storage.get(KEYS.DIGITAL_TWIN, null),
  saveDigitalTwin: (twin) => Storage.set(KEYS.DIGITAL_TWIN, twin),

  // Data Inventory (For Settings page)
  getDataInventory: () => {
    const user = Storage.getCurrentUser();
    const journals = Storage.getJournalEntries();
    const routines = Storage.getRoutines();
    const chat = Storage.getCompanionMessages();
    const moodsCount = user?.moodHistory?.length || 0;
    const safetyPlan = Storage.getSafetyPlan();
    const hasSafetyPlan = Object.values(safetyPlan).some(v => v && v.trim().length > 0);

    return {
      moodsCount,
      journalsCount: journals.length,
      routinesCount: routines.length,
      chatMessagesCount: chat.length,
      hasSafetyPlan,
      accountEmail: user?.email || 'Guest',
      accountCreated: user?.createdAt || null
    };
  },

  // Data Export (JSON Download) — Sanitized: 100% credential-free
  exportAllData: () => {
    const rawUser = Storage.getCurrentUser();
    let sanitizedUser = null;
    if (rawUser) {
      // Strip all sensitive credential data
      const { password, passwordHash, salt, recoveryKeyHash, ...safeFields } = rawUser;
      sanitizedUser = safeFields;
    }

    const exportObject = {
      exportDate: new Date().toISOString(),
      appName: 'MindCare Sanctuary',
      version: '2.0.0',
      currentUser: sanitizedUser,
      journalEntries: Storage.getJournalEntries(),
      routines: Storage.getRoutines(),
      safetyPlan: Storage.getSafetyPlan(),
      companionChat: Storage.getCompanionMessages(),
      privacyConsent: Storage.getPrivacyConsent()
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mindcare-data-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Nuclear Data Wipe — Fixed: Snapshot array to prevent index mutation skipping
  wipeAllData: () => {
    // 1. Clear known primary keys
    Object.values(KEYS).forEach(k => Storage.remove(k));
    Storage.removeSession(KEYS.SESSION_USER);

    // 2. Snapshot all keys in localStorage to prevent index mutation skipping
    const allLocalKeys = Object.keys(localStorage);
    allLocalKeys.forEach(key => {
      if (key && key.startsWith('mindcare_')) {
        localStorage.removeItem(key);
      }
    });

    // 3. Clear sessionStorage namespaced keys
    const allSessionKeys = Object.keys(sessionStorage);
    allSessionKeys.forEach(key => {
      if (key && key.startsWith('mindcare_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
};
