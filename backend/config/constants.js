// ============================================
// MindCare Sanctuary — Centralized System Constants & Rules
// Single source of truth for business rules, limits, roles, and WebRTC
// ============================================

import dotenv from 'dotenv';
dotenv.config();

export const ROLES = {
  CLIENT: 'client',
  THERAPIST: 'therapist',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted'
};

export const THERAPIST_STATUS = {
  REGISTERED: 'registered',
  DOCUMENTS_PENDING: 'documents_pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  MORE_INFO_REQUIRED: 'more_info_required',
  SUSPENDED: 'suspended'
};

export const AGE_LIMITS = {
  MIN: 20,
  MAX: 25
};

export const AUTH_CONFIG = {
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ADMIN_JWT_EXPIRES_IN: '2h',
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
  LOCKOUT_TIME_SECONDS: parseInt(process.env.LOCKOUT_TIME_SECONDS, 10) || 30,
  OTP_EXPIRY_MINUTES: 5,
  OTP_MAX_ATTEMPTS: 5,
  CLIENT_OTP_REQUIRED: process.env.CLIENT_OTP_REQUIRED === 'true',
  ADMIN_OTP_REQUIRED: process.env.ADMIN_OTP_REQUIRED === 'true'
};

export const WEBRTC_CONFIG = {
  STUN_SERVER: process.env.STUN_SERVER || 'stun:stun.l.google.com:19302',
  TURN_SERVER: process.env.TURN_SERVER || '',
  TURN_USERNAME: process.env.TURN_USERNAME || '',
  TURN_CREDENTIAL: process.env.TURN_CREDENTIAL || process.env.TURN_PASSWORD || ''
};

export const API_CONFIG = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

export const SOCKET_CONFIG = {
  MAX_MESSAGE_LENGTH: 1000,
  RATE_LIMIT_COUNT: 10,
  RATE_LIMIT_WINDOW_MS: 5000,
  HEARTBEAT_EXPIRY_MS: 60000,
  HEARTBEAT_SWEEP_INTERVAL_MS: 30000
};

export const AUTH_MESSAGES = {
  GENERIC_ERROR: "These details don't match. Please try again.",
  AGE_RESTRICTION: "MindCare Sanctuary is designed specifically for ages 20–25. Please enter an age between 20 and 25.",
  ADMIN_RECOVERY_FORBIDDEN: "Self-service recovery is disabled for administrator accounts. Please contact your Super Administrator."
};
