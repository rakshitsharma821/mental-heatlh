// ============================================
// MindCare Frontend — API Service Adapter
// Seamlessly connects to backend REST endpoints configured via .env
// Token-aware authenticated requests + graceful offline fallbacks
// ============================================

import { API_BASE_URL } from '../config/appConfig';

const TOKEN_KEY = 'mindcare_auth_token';

export const Api = {
  getBaseUrl: () => API_BASE_URL,

  // Token management
  getToken: () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),
  setToken: (token, remember = false) => {
    if (!token) return;
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    }
  },
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },

  getAuthHeaders: () => {
    const token = Api.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Check Backend Connectivity
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2500) });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  // --------------------------------------------
  // AUTH ENDPOINTS (Phase 1 & Task 1 Upgrade)
  // --------------------------------------------
  register: async (registerData, password, name, role = 'client') => {
    try {
      let payload = registerData;
      if (typeof registerData === 'string') {
        payload = { email: registerData, password, name, role };
      }

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.token) {
        Api.setToken(data.token, true);
      }
      return data;
    } catch (err) {
      return { success: false, offline: true, message: 'Server unreachable.' };
    }
  },

  registerTherapist: async (therapistData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register-therapist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(therapistData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, offline: true, message: 'Server unreachable.' };
    }
  },

  // Multi-portal login: Accepts login payload or (identifier, password)
  login: async (credentials, passwordParam, remember = false) => {
    try {
      let payload = credentials;
      let shouldRemember = remember;
      if (typeof credentials === 'string') {
        payload = { identifier: credentials, password: passwordParam, portal: 'member' };
      } else if (credentials.remember !== undefined) {
        shouldRemember = credentials.remember;
      }

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.token) {
        Api.setToken(data.token, shouldRemember);
      }
      return data;
    } catch (err) {
      return { success: false, offline: true, message: 'Server unreachable.' };
    }
  },

  requestRecoveryOtp: async (email, role = 'client') => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/recovery/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  verifyRecoveryOtp: async (challenge_id, otp) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/recovery/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id, otp })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  completeRecovery: async (recoveryData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/recovery/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recoveryData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  // Login step 2: Verify 6-digit OTP code with challenge_id
  verifyOtp: async (challenge_id, otp, remember = false) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id, otp })
      });
      const data = await res.json();
      if (data.success && data.token) {
        Api.setToken(data.token, remember);
      }
      return data;
    } catch (err) {
      return { success: false, offline: true, message: 'Server unreachable.' };
    }
  },

  // Resend OTP code with rate limit protection
  resendOtp: async (challenge_id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id })
      });
      return await res.json();
    } catch (err) {
      return { success: false, offline: true, message: 'Server unreachable.' };
    }
  },

  getMe: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, offline: true };
    }
  },

  recoverPassword: async (email, recoveryPhrase, newPassword) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, recoveryPhrase, newPassword })
      });
      return await res.json();
    } catch (err) {
      return { success: false, offline: true, message: 'Server unreachable.' };
    }
  },

  syncSession: async (email, name, role = 'client') => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role })
      });
      const data = await res.json();
      if (data.success && data.token) {
        Api.setToken(data.token, true);
      }
      return data;
    } catch (err) {
      return { success: false, offline: true, message: 'Server unreachable.' };
    }
  },

  // --------------------------------------------
  // MOOD TRACKING (Phase 1)
  // --------------------------------------------
  logMood: async (moodData) => {
    try {
      // If user_email is not explicitly provided, attempt to inject from local user
      let payload = { ...moodData };
      if (!payload.user_email) {
        try {
          const raw = localStorage.getItem('mindcare_current_user') || sessionStorage.getItem('mindcare_session_user');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.email) payload.user_email = parsed.email;
          }
        } catch (e) {}
      }

      const res = await fetch(`${API_BASE_URL}/mood`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        Api.removeToken();
        return { success: true, offline: true, message: 'Saved locally' };
      }
      return await res.json();
    } catch (err) {
      return { success: false, offline: true };
    }
  },

  getMoodHistory: async (limit = 30) => {
    try {
      const res = await fetch(`${API_BASE_URL}/mood/history?limit=${limit}`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, moods: [] };
    }
  },

  getMoodAnalytics: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/mood/analytics`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  },

  // --------------------------------------------
  // ENCRYPTED JOURNAL (Phase 1)
  // --------------------------------------------
  createJournalEntry: async (content, sentimentTag) => {
    try {
      const res = await fetch(`${API_BASE_URL}/journal`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ content, sentiment_tag: sentimentTag })
      });
      return await res.json();
    } catch (err) {
      return { success: false, offline: true };
    }
  },

  getJournalEntries: async (limit = 30) => {
    try {
      const res = await fetch(`${API_BASE_URL}/journal?limit=${limit}`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, entries: [] };
    }
  },

  deleteJournalEntry: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/journal/${id}`, {
        method: 'DELETE',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, offline: true };
    }
  },

  // --------------------------------------------
  // ACTIVITY & EXERCISES (Phase 1)
  // --------------------------------------------
  logActivity: async (activityType, durationSeconds = 180, completed = 1) => {
    try {
      const res = await fetch(`${API_BASE_URL}/activity`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ activity_type: activityType, duration_seconds: durationSeconds, completed })
      });
      return await res.json();
    } catch (err) {
      return { success: false, offline: true };
    }
  },

  getActivities: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/activity`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, activities: [] };
    }
  },

  // --------------------------------------------
  // AI COMPANION MEMORY (Phase 1)
  // --------------------------------------------
  saveCompanionMemory: async (summaryText, memoryType = 'short_term', importanceWeight = 0.5) => {
    try {
      const res = await fetch(`${API_BASE_URL}/companion/memory`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ summary_text: summaryText, memory_type: memoryType, importance_weight: importanceWeight })
      });
      return await res.json();
    } catch (err) {
      return { success: false, offline: true };
    }
  },

  getCompanionMemories: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/companion/memory`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, memories: [] };
    }
  },

  clearCompanionMemories: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/companion/memory`, {
        method: 'DELETE',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, offline: true };
    }
  },

  // --------------------------------------------
  // THERAPY ROADMAP (Phase 1)
  // --------------------------------------------
  getRoadmap: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/roadmap`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  },

  toggleMilestone: async (milestoneId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/roadmap/milestones/${milestoneId}/toggle`, {
        method: 'POST',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, offline: true };
    }
  },

  switchTrack: async (trackName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/roadmap/track`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ trackName })
      });
      return await res.json();
    } catch (err) {
      return { success: false, offline: true };
    }
  },

  // --------------------------------------------
  // CLINICAL & CRISIS (Phase 3 & Task 6 Upgrades)
  // --------------------------------------------
  getClinicalAvailability: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/availability`);
      return await res.json();
    } catch (err) {
      return { success: false, fallbackToAi: true, isAnyAvailable: false, therapists: [] };
    }
  },

  getTherapist: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/therapist`);
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  },

  getTherapistProfile: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/profile`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  updateTherapistProfile: async (data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/profile`, {
        method: 'PUT',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getTherapistDocuments: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/documents`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, documents: [] };
    }
  },

  uploadTherapistDocument: async (formData) => {
    try {
      const token = Storage.get('mindcare_auth_token') || localStorage.getItem('mindcare_auth_token');
      const res = await fetch(`${API_BASE_URL}/clinical/documents/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'File upload failed.' };
    }
  },

  deleteTherapistDocument: async (docId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/documents/${docId}`, {
        method: 'DELETE',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  submitTherapistDossier: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/documents/submit-for-review`, {
        method: 'POST',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getSignedDocumentUrl: async (docId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/documents/${docId}/signed-url`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  toggleTherapistAvailability: async (is_available) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/availability/toggle`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ is_available })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getRtcConfig: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/rtc-config`);
      return await res.json();
    } catch (err) {
      return { success: true, iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    }
  },

  saveTreatmentPlan: async (planData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/treatment-plan`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify(planData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  updateEvaluation: async (clientId, evalData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/evaluation/${clientId}`, {
        method: 'PATCH',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify(evalData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getTreatmentPlan: async (clientId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/treatment-plan/${clientId}`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, hasPlan: false };
    }
  },

  submitBooking: async (bookingData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, offline: true };
    }
  },

  getBookingRequests: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/requests`);
      return await res.json();
    } catch (err) {
      return { success: false, requests: [] };
    }
  },

  verifyConsentKey: async (pairingKey, clientId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/verify-consent-key`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ pairingKey, clientId })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  // Part 5: Therapist Availability & Schedule
  getTherapistSchedule: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/availability/my-schedule`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  updateTherapistSchedule: async (scheduleData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/availability/my-schedule`, {
        method: 'PUT',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify(scheduleData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  sendTherapistHeartbeat: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/availability/heartbeat`, {
        method: 'POST',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getTherapistDirectory: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${API_BASE_URL}/clinical/directory?${params.toString()}`);
      return await res.json();
    } catch (err) {
      return { success: false, therapists: [] };
    }
  },

  getTherapistPublicAvailability: async (therapistId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/therapists/${therapistId}/availability`);
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  // Part 5: Session Request Pipeline (Client)
  createSessionRequest: async (requestData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/session-requests`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify(requestData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getMySessions: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/my-sessions`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, sessions: [] };
    }
  },

  cancelSession: async (sessionId, reason) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/session-requests/${sessionId}/cancel`, {
        method: 'PATCH',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  // Part 5: Session Requests (Therapist)
  getTherapistSessions: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/therapist/sessions`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, sessions: [] };
    }
  },

  therapistSessionAction: async (sessionId, actionData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/session-requests/${sessionId}/therapist-action`, {
        method: 'PATCH',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify(actionData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getSessionHistory: async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clinical/session-requests/${sessionId}/history`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, history: [] };
    }
  },

  // --------------------------------------------
  // COMMUNITY SANCTUARY (Phase 4 & Part 6)
  // --------------------------------------------
  getCommunityProfile: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/profile`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  updateCommunityProfile: async (profileData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/profile`, {
        method: 'PUT',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getCommunityCircles: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/circles`);
      return await res.json();
    } catch (err) {
      return { success: false, circles: [] };
    }
  },

  getCommunityPosts: async (circleId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/circles/${circleId}/posts`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, posts: [] };
    }
  },

  createCommunityPost: async (circleId, text) => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/circles/${circleId}/posts`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ text })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  heartCommunityPost: async (postId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/posts/${postId}/heart`, {
        method: 'POST',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  },

  cheerCommunityPost: async (circleId, postId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/posts/${postId}/heart`, {
        method: 'POST',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  },

  reportCommunityPost: async (postId, reason) => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/posts/${postId}/report`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  requestPeerMatch: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/peer-match/request`, {
        method: 'POST',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getPeerMatchStatus: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/peer-match/status`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, hasMatch: false };
    }
  },

  leavePeerMatch: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/peer-match/leave`, {
        method: 'POST',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getReportedCommunityPosts: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/community/reports`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, reports: [] };
    }
  },

  moderateCommunityPost: async (postId, status, admin_notes) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/community/posts/${postId}/moderate`, {
        method: 'PATCH',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ status, admin_notes })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  // --------------------------------------------
  // ADMIN SYSTEM (Phase B: Roles + Admin Portal)
  // --------------------------------------------
  getAdminStats: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getAdminUsers: async (params = {}) => {
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/admin/users?${qs}`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, users: [], total: 0 };
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ role })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  updateUserStatus: async (userId, status, reason = '') => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ status, reason })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  createAdmin: async (adminData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/create-admin`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify(adminData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getSystemAuditLogs: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/system-audit-logs`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, auditLogs: [] };
    }
  },

  getAdminTherapists: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/therapists`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, therapists: [] };
    }
  },

  updateTherapistVerification: async (therapistId, verification_status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/therapists/${therapistId}/verification`, {
        method: 'PATCH',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ verification_status })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getAdminAuditLogs: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, auditLogs: [] };
    }
  },

  // PART 4: ADMIN SYSTEM EXTENSIONS
  getTherapistQueue: async (params = {}) => {
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/admin/therapists/queue?${qs}`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, therapists: [] };
    }
  },

  getTherapistDossier: async (therapistId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/therapists/${therapistId}/dossier`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  reviewTherapistDocument: async (therapistId, docId, status, rejection_reason = '') => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/therapists/${therapistId}/documents/${docId}/review`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ status, rejection_reason })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  makeVerificationDecision: async (therapistId, data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/therapists/${therapistId}/verification-decision`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  deleteTherapist: async (therapistId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/therapists/${therapistId}`, {
        method: 'DELETE',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  sendRegistrationOtp: async (email) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Could not connect to verification server.' };
    }
  },

  verifyRegistrationOtp: async (email, otp) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Could not connect to verification server.' };
    }
  },

  getTherapistAssignedClients: async (therapistId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/therapists/${therapistId}/assigned-clients`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, clients: [] };
    }
  },

  forcePasswordReset: async (userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/force-password-reset`, {
        method: 'POST',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  deleteUserOnRequest: async (userId, reason = 'DPDP erasure request') => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ confirmation: true, reason })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getSessionRequests: async (status = '') => {
    try {
      const qs = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await fetch(`${API_BASE_URL}/admin/session-requests${qs}`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, requests: [] };
    }
  },

  assignTherapistToRequest: async (bookingId, therapist_id, admin_notes = '') => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/session-requests/${bookingId}/assign`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ therapist_id, admin_notes })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  updateSessionOutcome: async (bookingId, outcome, notes = '') => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/session-requests/${bookingId}/outcome`, {
        method: 'PATCH',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ outcome, notes })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getDeclines: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/declines`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, declines: [] };
    }
  },

  getDeclineThread: async (declineId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/declines/${declineId}/thread`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, messages: [] };
    }
  },

  postDeclineMessage: async (declineId, message) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/declines/${declineId}/ask-why`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ message })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  resolveDecline: async (declineId, action, new_therapist_id = null, notes = '') => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/declines/${declineId}/resolve`, {
        method: 'POST',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ action, new_therapist_id, notes })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getAdminConfig: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/config`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  updateBlockedWords: async (blocked_words) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/config/blocked-words`, {
        method: 'PUT',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ blocked_words })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  updateHelplines: async (helplines) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/config/helplines`, {
        method: 'PUT',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ helplines })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getSafetyReports: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/safety-reports`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, totalEvents: 0, recentEvents: [] };
    }
  },

  getComplaints: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/complaints`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, complaints: [] };
    }
  },

  updateComplaint: async (complaintId, status, admin_notes = '') => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ status, admin_notes })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  updateAdminStatus: async (adminId, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/super/admins/${adminId}/status`, {
        method: 'PATCH',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  resetAdminCredentials: async (adminId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/super/admins/${adminId}/reset-credentials`, {
        method: 'POST',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getConsentAuditLogs: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/consent-audit-logs`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, auditLogs: [] };
    }
  },

  // ============================================
  // Part 7: Opt-in Notifications & Quiet Hours API
  // ============================================
  getNotificationPreferences: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/preferences`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, preferences: { optIn: false } };
    }
  },

  updateNotificationPreferences: async (data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/preferences`, {
        method: 'PUT',
        headers: Api.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getNotifications: async (limit = 30) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications?limit=${limit}`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, unreadCount: 0, notifications: [] };
    }
  },

  markNotificationRead: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  markAllNotificationsRead: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server unreachable.' };
    }
  },

  getNotificationConsentAudit: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/consent-history`, {
        headers: Api.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, consentHistory: [] };
    }
  }
};
