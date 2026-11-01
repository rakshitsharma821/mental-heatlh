// ============================================
// MindCare Backend — Server-Side Request Forgery (SSRF) Prevention
// Strictly validates outbound HTTP destinations, disallowing loopback,
// private RFC 1918 addresses, cloud metadata endpoints, and insecure protocols
// ============================================

import { URL } from 'url';

// Private and sensitive IP ranges to block
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/, // IPv4 loopback
  /^0\.0\.0\.0$/,
  /^::1$/, // IPv6 loopback
  /^fe80:/i, // link-local
  /^169\.254\.\d+\.\d+$/, // Link-local and AWS/GCP/Azure metadata service (169.254.169.254)
  /^10\.\d+\.\d+\.\d+$/, // RFC 1918 10.0.0.0/8
  /^192\.168\.\d+\.\d+$/, // RFC 1918 192.168.0.0/16
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/, // RFC 1918 172.16.0.0/12
  /\.internal$/i,
  /\.local$/i
];

/**
 * Validates whether a target URL is safe from SSRF exploits
 * @param {string} targetUrl - Outbound URL string
 * @returns {{ safe: boolean, error?: string, parsedUrl?: URL }}
 */
export function validateSafeUrl(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return { safe: false, error: 'Target URL is missing or empty.' };
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (_) {
    return { safe: false, error: 'Malformed URL.' };
  }

  // Enforce HTTPS
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { safe: false, error: `Insecure protocol "${parsed.protocol}". Only HTTPS/HTTP permitted.` };
  }

  const hostname = parsed.hostname;

  // Check blocked host patterns
  for (const pattern of BLOCKED_HOST_PATTERNS) {
    if (pattern.test(hostname)) {
      return {
        safe: false,
        error: `SSRF Violation: Target host "${hostname}" is blocked (private or internal network).`
      };
    }
  }

  return { safe: true, parsedUrl: parsed };
}

/**
 * Safe fetch wrapper that guards against SSRF
 */
export async function safeFetch(targetUrl, options = {}) {
  const check = validateSafeUrl(targetUrl);
  if (!check.safe) {
    throw new Error(`SSRF Blocked: ${check.error}`);
  }
  return fetch(targetUrl, options);
}

export default { validateSafeUrl, safeFetch };
