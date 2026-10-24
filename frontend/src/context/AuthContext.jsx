// ============================================
// MindCare — Unified Authentication & State Engine
// Hardened Security: Salted SHA-256 Hashing, Brute-Force Rate Limiting,
// Cross-Tab Session Synchronization, Self-Sovereign Password Recovery
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Storage } from '../services/storage';
import { Api } from '../services/api';

const AuthContext = createContext(null);

// Recovery dictionary for 3-word self-sovereign seed phrases
const RECOVERY_WORDS = [
  'cedar', 'willow', 'sage', 'river', 'stone', 'breeze', 'ember', 'dawn',
  'meadow', 'lotus', 'sprout', 'ocean', 'canopy', 'haven', 'silent', 'amber'
];

function generateRecoveryPhrase() {
  const chosen = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * RECOVERY_WORDS.length);
    chosen.push(RECOVERY_WORDS[idx]);
  }
  return chosen.join('-');
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Synchronize streak and daily login
  const syncStreakOnLoad = useCallback((current) => {
    if (!current) return null;
    const lastLogin = new Date(current.lastLoginDate || current.createdAt);
    const today = new Date();

    if (lastLogin.toDateString() !== today.toDateString()) {
      const diffDays = Math.round((today - lastLogin) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        current.streak = (current.streak || 1) + 1;
      } else if (diffDays > 1) {
        current.streak = 1;
      }
      current.lastLoginDate = today.toISOString();

      // Persist to both session and master users array
      const users = Storage.getUsers();
      const idx = users.findIndex(u => u.id === current.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], streak: current.streak, lastLoginDate: current.lastLoginDate };
        Storage.saveUsers(users);
      }
      Storage.setCurrentUser(current, !!Storage.getRememberedUser());
    }

    if (!current.role) current.role = 'client';
    return current;
  }, []);

  // Initialize Session on App Mount
  useEffect(() => {
    let current = Storage.getCurrentUser();
    if (current) {
      current = syncStreakOnLoad(current);
      setUser(current);

      // Auto-sync token with PostgreSQL backend if absent
      if (!Api.getToken() && current.email) {
        Api.syncSession(current.email, current.name, current.role).catch(() => {});
      }
    }
    setLoading(false);

    // Cross-Tab Synchronization via window 'storage' event
    const handleStorageChange = (e) => {
      if (e.key === 'mindcare_current_user' || e.key === 'mindcare_session_user' || e.key === null) {
        const freshUser = Storage.getCurrentUser();
        setUser(freshUser);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncStreakOnLoad]);

  // Lockout countdown timer effect
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  // Login with rate limiting, email trimming, and salted SHA-256 verification
  const login = async (credentials, passwordParam, rememberParam = false) => {
    let payload = credentials;
    let remember = rememberParam;
    let identifier = '';
    let password = '';

    if (typeof credentials === 'string') {
      identifier = credentials.trim();
      password = passwordParam || '';
      payload = { identifier, password, portal: 'member' };
    } else if (credentials && typeof credentials === 'object') {
      identifier = (credentials.identifier || credentials.email || credentials.adminId || credentials.therapistId || '').trim();
      password = credentials.password || '';
      remember = credentials.remember !== undefined ? credentials.remember : rememberParam;
    }

    if (!identifier || !password) {
      return { success: false, message: 'Please enter your login details.' };
    }

    // Check Lockout Status
    const lockoutData = Storage.get('mindcare_auth_lockout', { attempts: 0, lockedUntil: null });
    const now = Date.now();

    if (lockoutData.lockedUntil && now < lockoutData.lockedUntil) {
      const waitSec = Math.ceil((lockoutData.lockedUntil - now) / 1000);
      setLockoutRemaining(waitSec);
      return {
        success: false,
        locked: true,
        remainingSeconds: waitSec,
        message: `Too many failed attempts. Sanctuary access locked for ${waitSec} seconds.`
      };
    }

    // Call backend authoritative login first
    try {
      const backendRes = await Api.login(payload, password, remember);
      if (backendRes.success) {
        Storage.set('mindcare_auth_lockout', { attempts: 0, lockedUntil: null });
        setLockoutRemaining(0);
        if (backendRes.user) {
          Storage.setCurrentUser(backendRes.user, remember);
          setUser(backendRes.user);
        }
        return backendRes;
      } else if (!backendRes.offline) {
        // Increment failed attempts
        const nextAttempts = (lockoutData.attempts || 0) + 1;
        let nextLockout = null;
        let waitSec = 0;
        if (nextAttempts >= 5) {
          waitSec = 30;
          nextLockout = now + (waitSec * 1000);
          setLockoutRemaining(waitSec);
        }
        Storage.set('mindcare_auth_lockout', { attempts: nextAttempts, lockedUntil: nextLockout });
        return {
          success: false,
          locked: nextAttempts >= 5,
          remainingSeconds: waitSec,
          message: backendRes.message || "These details don't match. Please try again."
        };
      }
    } catch (_) {
      // Fallback to local storage if offline
    }

    const trimmedEmail = identifier.toLowerCase();
    const cleanPassword = password;
    const users = Storage.getUsers();
    const found = users.find(u => (u.email || '').trim().toLowerCase() === trimmedEmail);

    let isMatch = false;

    if (found) {
      if (found.passwordHash && found.salt) {
        // Modern salted SHA-256 hash comparison
        const computedHash = await Storage.hashPassword(cleanPassword, found.salt);
        isMatch = (computedHash === found.passwordHash);
      } else if (found.password) {
        // Backwards compatibility for legacy accounts: Upgrade on first successful login
        if (found.password === cleanPassword) {
          isMatch = true;
          const newSalt = 'salt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
          found.passwordHash = await Storage.hashPassword(cleanPassword, newSalt);
          found.salt = newSalt;
          delete found.password; // Strip legacy plaintext
          Storage.saveUsers(users);
        }
      }
    }

    if (!isMatch) {
      // Increment failed attempts
      const nextAttempts = (lockoutData.attempts || 0) + 1;
      let nextLockout = null;
      let waitSec = 0;

      if (nextAttempts >= 5) {
        waitSec = 30; // 30 second cooldown
        nextLockout = now + (waitSec * 1000);
        setLockoutRemaining(waitSec);
      }

      Storage.set('mindcare_auth_lockout', { attempts: nextAttempts, lockedUntil: nextLockout });

      const attemptMsg = nextAttempts >= 5
        ? `Too many failed attempts. Sanctuary access locked for ${waitSec} seconds.`
        : 'Invalid email or password. Please verify your credentials.';

      return {
        success: false,
        locked: nextAttempts >= 5,
        remainingSeconds: waitSec,
        message: attemptMsg
      };
    }

    // Successful login: Reset lockout state
    Storage.set('mindcare_auth_lockout', { attempts: 0, lockedUntil: null });
    setLockoutRemaining(0);

    found.lastLoginDate = new Date().toISOString();
    if (!found.role) found.role = 'client';

    // Persist to master users array and active session
    Storage.saveUsers(users);
    Storage.setCurrentUser(found, remember);
    setUser(found);

    // Sync token with backend API
    Api.login(trimmedEmail, cleanPassword).then(res => {
      if (res && res.token) {
        localStorage.setItem('mindcare_auth_token', res.token);
      } else {
        Api.syncSession(trimmedEmail, found.name, found.role).catch(() => {});
      }
    }).catch(() => {
      Api.syncSession(trimmedEmail, found.name, found.role).catch(() => {});
    });

    return { success: true, user: found };
  };

  // Register with input sanitation, password hashing, and recovery phrase generation
  // Register with demographics, mobile normalization, scrypt backend sync, and recovery phrase
  const register = async (registerData, legacyPassword, legacyName, legacyRole = 'client') => {
    let payload = registerData;
    if (typeof registerData === 'string') {
      payload = { email: registerData, password: legacyPassword, name: legacyName, role: legacyRole };
    }

    const trimmedEmail = (payload.email || '').trim().toLowerCase();
    const cleanPassword = payload.password || '';
    const cleanName = (payload.name || '').trim();
    const cleanMobile = (payload.mobile_number || payload.mobile || '').trim();
    const cleanGender = (payload.gender || '').trim();
    const cleanCity = (payload.city || '').trim();
    const cleanState = (payload.state || '').trim();
    const cleanAddress = (payload.address || '').trim() || `${cleanCity}, ${cleanState}`.trim();
    const parsedAge = parseInt(payload.age, 10);
    const role = payload.role || 'client';

    if (!trimmedEmail || !cleanPassword || !cleanName || !payload.age || !cleanGender) {
      return { success: false, message: 'All registration fields are required.' };
    }

    if (isNaN(parsedAge) || parsedAge < 20 || parsedAge > 25) {
      return { success: false, message: 'MindCare Sanctuary is designed specifically for ages 20–25.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (cleanPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }

    // Call backend API for authoritative registration
    const backendRes = await Api.register({
      name: cleanName,
      email: trimmedEmail,
      password: cleanPassword,
      mobile_number: cleanMobile || null,
      age: parsedAge,
      gender: cleanGender,
      city: cleanCity,
      state: cleanState,
      address: cleanAddress,
      role
    });

    if (!backendRes.success && !backendRes.offline) {
      return backendRes;
    }

    // Local client-side sanctuary storage sync
    const users = Storage.getUsers();
    const salt = 'salt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const passwordHash = await Storage.hashPassword(cleanPassword, salt);
    const recoveryPhrase = backendRes.recoveryPhrase || generateRecoveryPhrase();
    const recoveryKeyHash = await Storage.hashPassword(recoveryPhrase, salt);

    const newUser = {
      id: backendRes.user?.id || Date.now(),
      email: trimmedEmail,
      name: cleanName,
      role,
      mobile_number: backendRes.user?.mobile_number || cleanMobile,
      age: parsedAge,
      gender: cleanGender,
      address: cleanAddress,
      passwordHash,
      salt,
      recoveryKeyHash,
      createdAt: new Date().toISOString(),
      lastLoginDate: new Date().toISOString(),
      streak: 1,
      score: 10,
      moodHistory: []
    };

    users.push(newUser);
    Storage.saveUsers(users);
    Storage.setCurrentUser(newUser, true);
    setUser(newUser);

    return {
      success: true,
      user: newUser,
      recoveryPhrase
    };
  };

  // Recover / Reset Password via 3-word recovery phrase
  const recoverPassword = async (email, recoveryPhrase, newPassword) => {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const cleanPhrase = (recoveryPhrase || '').trim().toLowerCase();
    const cleanNewPass = newPassword || '';

    if (!trimmedEmail || !cleanPhrase || !cleanNewPass) {
      return { success: false, message: 'All recovery fields are required.' };
    }

    if (cleanNewPass.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    const users = Storage.getUsers();
    const userIndex = users.findIndex(u => (u.email || '').trim().toLowerCase() === trimmedEmail);

    if (userIndex === -1) {
      return { success: false, message: 'No sanctuary record found for this email address.' };
    }

    const targetUser = users[userIndex];
    if (!targetUser.recoveryKeyHash || !targetUser.salt) {
      return { success: false, message: 'Account does not have an active recovery key configured.' };
    }

    const computedPhraseHash = await Storage.hashPassword(cleanPhrase, targetUser.salt);
    if (computedPhraseHash !== targetUser.recoveryKeyHash) {
      return { success: false, message: 'Incorrect recovery phrase. Please check your seed words.' };
    }

    // Reset password with fresh salt
    const newSalt = 'salt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    targetUser.salt = newSalt;
    targetUser.passwordHash = await Storage.hashPassword(cleanNewPass, newSalt);
    targetUser.recoveryKeyHash = await Storage.hashPassword(cleanPhrase, newSalt);
    delete targetUser.password; // Strip any legacy plaintext if present

    users[userIndex] = targetUser;
    Storage.saveUsers(users);

    return { success: true, message: 'Password successfully reset. You may now log in.' };
  };

  const logout = () => {
    Api.removeToken();
    Storage.removeCurrentUser();
    // Clear welcome message sessionStorage on logout to prevent cross-user leakage
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('mindcare_welcome_msg_')) {
          sessionStorage.removeItem(key);
        }
      });
      sessionStorage.removeItem('mindcare_welcome_msg_cache');
    } catch (_) {}
    setUser(null);
  };

  const switchRole = (newRole) => {
    if (!user) return;
    updateUser({ role: newRole });
  };

  const updateUser = (fields) => {
    if (!user) return;
    const updated = { ...user, ...fields };
    const users = Storage.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = updated;
      Storage.saveUsers(users);
    }
    Storage.setCurrentUser(updated, !!Storage.getRememberedUser());
    setUser(updated);
  };

  const addMood = (mood, intensity = 5, note = '') => {
    let currentUser = user || Storage.getCurrentUser();
    if (!currentUser) {
      currentUser = {
        id: 'usr_' + Date.now(),
        name: 'Sanctuary Member',
        email: 'sanctuary@mindcare.local',
        role: 'client',
        streak: 1,
        score: 10,
        moodHistory: []
      };
      Storage.setCurrentUser(currentUser, true);
      setUser(currentUser);
    }

    const moodEntry = {
      id: Date.now(),
      mood,
      intensity,
      note,
      date: new Date().toISOString(),
      timestamp: Date.now()
    };

    const moodHistory = currentUser.moodHistory ? [moodEntry, ...currentUser.moodHistory] : [moodEntry];
    const updated = { ...currentUser, moodHistory };

    // Update in master users list and session storage
    const users = Storage.getUsers();
    const index = users.findIndex(u => u.id === currentUser.id || (u.email && u.email === currentUser.email));
    if (index !== -1) {
      users[index] = updated;
      Storage.saveUsers(users);
    } else {
      users.push(updated);
      Storage.saveUsers(users);
    }

    Storage.setCurrentUser(updated, !!Storage.getRememberedUser());
    setUser(updated);

    // Sync to PostgreSQL backend
    Api.logMood({
      mood_label: mood,
      energy_level: intensity,
      valence_score: Number(((intensity - 5) / 5).toFixed(2)),
      notes: note,
      user_email: currentUser.email
    }).catch(() => {});

    return moodEntry;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      lockoutRemaining,
      login,
      register,
      verifyOtp: async (challenge_id, otp, remember = false) => {
        const res = await Api.verifyOtp(challenge_id, otp, remember);
        if (res.success && res.user) {
          Storage.setCurrentUser(res.user, remember);
          setUser(res.user);
        }
        return res;
      },
      resendOtp: async (challenge_id) => {
        return await Api.resendOtp(challenge_id);
      },
      recoverPassword,
      logout,
      updateUser,
      switchRole,
      addMood
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
