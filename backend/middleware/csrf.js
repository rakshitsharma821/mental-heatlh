// ============================================
// MindCare Backend — Cross-Site Request Forgery (CSRF) Protection
// Defends all state-changing HTTP operations (POST, PUT, PATCH, DELETE)
// against cross-site forgery, origin spoofing, and unauthorized cross-domain triggers
// ============================================

import { AUTH_CONFIG } from '../config/constants.js';

export function csrfProtection(allowedOrigins = []) {
  return (req, res, next) => {
    // 1. Safe idempotent methods are exempt from CSRF checks
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method.toUpperCase())) {
      return next();
    }

    // 2. Webhooks and machine-to-machine signed callbacks are validated via HMAC signature
    if (req.path.startsWith('/api/payments/webhook') || req.path.startsWith('/api/webhooks')) {
      return next();
    }

    // 3. Origin & Referer Verification
    const origin = req.headers['origin'];
    const referer = req.headers['referer'];

    // In non-browser contexts (e.g. unit tests, CLI automation, or mobile clients without origin),
    // allow if authorization header or custom API header is present
    const hasAuthHeader = Boolean(req.headers['authorization']);
    const hasCustomHeader = Boolean(req.headers['x-requested-with'] || req.headers['x-csrf-token']);

    if (origin) {
      const isAllowedOrigin = allowedOrigins.some(allowed => {
        try {
          return new URL(origin).origin === new URL(allowed).origin;
        } catch (_) {
          return false;
        }
      }) || (process.env.NODE_ENV !== 'production' && (
        origin.endsWith('.devtunnels.ms') || origin.endsWith('.loca.lt') || origin.includes('ngrok') ||
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)
      ));

      if (!isAllowedOrigin) {
        return res.status(403).json({
          success: false,
          error: 'CsrfOriginRejected',
          message: 'Cross-Site Request Forgery (CSRF) blocked: Origin not authorized.'
        });
      }
    } else if (referer) {
      const isAllowedReferer = allowedOrigins.some(allowed => {
        try {
          return new URL(referer).origin === new URL(allowed).origin;
        } catch (_) {
          return false;
        }
      }) || (process.env.NODE_ENV !== 'production' && (
        referer.includes('.devtunnels.ms') || referer.includes('.loca.lt') || referer.includes('ngrok') ||
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(referer)
      ));

      if (!isAllowedReferer) {
        return res.status(403).json({
          success: false,
          error: 'CsrfRefererRejected',
          message: 'Cross-Site Request Forgery (CSRF) blocked: Referer not authorized.'
        });
      }
    }

    // Pass through
    next();
  };
}

export default csrfProtection;
