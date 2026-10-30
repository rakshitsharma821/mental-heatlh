// ============================================
// MindCare Backend — Input Sanitization & Anti-XSS Middleware
// Recursively sanitizes string inputs against Cross-Site Scripting (XSS)
// and Dangerous Script Injections while preserving clinical formatting
// ============================================

/**
 * Clean a single string from XSS vectors and script injection
 */
export function sanitizeString(val) {
  if (typeof val !== 'string') return val;

  let cleaned = val;

  // 1. Remove dangerous script and object tags and their contents
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  cleaned = cleaned.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  cleaned = cleaned.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

  // 2. Remove dangerous protocol URIs
  cleaned = cleaned.replace(/javascript\s*:/gi, '');
  cleaned = cleaned.replace(/vbscript\s*:/gi, '');
  cleaned = cleaned.replace(/data\s*:\s*text\/html/gi, '');

  // 3. Remove inline event handlers (e.g. onerror=, onload=, onclick=)
  cleaned = cleaned.replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // 4. Strip null bytes
  cleaned = cleaned.replace(/\0/g, '');

  return cleaned.trim();
}

/**
 * Deep recursive traversal of objects and arrays
 */
export function deepSanitize(target) {
  if (!target || typeof target !== 'object') {
    return typeof target === 'string' ? sanitizeString(target) : target;
  }

  if (Array.isArray(target)) {
    return target.map(item => deepSanitize(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(target)) {
    // Sanitize key name itself to prevent parameter pollution/prototype injection
    const cleanKey = sanitizeString(key);
    if (cleanKey === '__proto__' || cleanKey === 'constructor' || cleanKey === 'prototype') {
      continue; // Block prototype pollution vectors
    }
    result[cleanKey] = deepSanitize(value);
  }
  return result;
}

/**
 * Express middleware for automatic input sanitization
 */
export function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = deepSanitize(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = deepSanitize(req.params);
  }
  next();
}

export default sanitizeInput;
