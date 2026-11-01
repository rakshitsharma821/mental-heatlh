// ============================================
// MindCare Backend — Security & Rate Limiting Module
// Implements Helmet Security Headers, Strict CORS Policy,
// and Tiered Denial-of-Service / Brute-Force Rate Limiters
// ============================================

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * 1. Global API Rate Limiter
 * 200 requests per 15 minutes per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many requests from this IP address. Please pause and try again in a few minutes.'
  }
});

/**
 * 2. Strict Authentication & Credential Rate Limiter
 * 25 attempts per 15 minutes per IP
 * Protects against credential stuffing and brute-force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TooManyAuthAttempts',
    message: 'Too many authentication attempts. For your security, this endpoint is temporarily paused. Please retry after 15 minutes.'
  }
});

/**
 * 3. AI Inference & Companion Rate Limiter
 * 30 requests per 15 minutes per IP
 * Protects third-party API keys and server resources
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TooManyAIRequests',
    message: 'AI wellness companion rate limit reached. Take a gentle pause and return shortly.'
  }
});

/**
 * 4. Document Vault & File Upload Rate Limiter
 * 20 uploads per 15 minutes per IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TooManyUploads',
    message: 'Upload rate limit reached. Please wait a few moments before submitting additional documents.'
  }
});

/**
 * 5. HTTPS Enforcement Middleware
 * Redirects or rejects plaintext HTTP connections in production
 */
export function enforceHttps(req, res, next) {
  const isProduction = (process.env.NODE_ENV || 'development').trim() === 'production';
  if (!isProduction) {
    return next();
  }

  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  if (!isHttps) {
    // If GET or HEAD, redirect to HTTPS
    if (req.method === 'GET' || req.method === 'HEAD') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    return res.status(403).json({
      success: false,
      error: 'HttpsRequired',
      message: 'Encrypted HTTPS protocol required for all API interactions.'
    });
  }
  next();
}

/**
 * 6. Helmet Security Headers Configuration
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:', 'data:', 'blob:'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'blob:'],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false, // Allows cross-origin video/audio streams for WebRTC
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' }, // Anti-clickjacking
  hidePoweredBy: true, // Disables X-Powered-By: Express
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true, // X-Content-Type-Options: nosniff
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});
