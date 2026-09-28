// ============================================
// MindCare Frontend — API Service Adapter
// Seamlessly connects to backend REST endpoints configured via .env
// Token-aware authenticated requests + graceful offline fallbacks
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
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
  // AUTH ENDPOINTS (Phase 1)
  // --------------------------------------------
  register: async (email, password, name, role = 'client') => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role })
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

  login: async (email, password, remember = false) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
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
  // CLINICAL & CRISIS (Phase 3)
  // --------------------------------------------
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

  // --------------------------------------------
  // COMMUNITY SANCTUARY (Phase 4)
  // --------------------------------------------
  getCommunityPosts: async (circleId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/circles/${circleId}/posts`);
      return await res.json();
    } catch (err) {
      return { success: false, posts: [] };
    }
  },

  createCommunityPost: async (circleId, text, author) => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/circles/${circleId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, author })
      });
      return await res.json();
    } catch (err) {
      return { success: false, offline: true };
    }
  },

  cheerCommunityPost: async (circleId, postId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/circles/${circleId}/posts/${postId}/cheer`, {
        method: 'POST'
      });
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  }
};
