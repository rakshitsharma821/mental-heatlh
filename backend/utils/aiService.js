// ============================================
// MindCare Backend – OpenRouter AI Service
// Generates dynamic, compassionate welcome messages & AI companion responses
// ============================================

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { filterOutput, BLOCKED_WORDS } from './blockedWords.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 12000; // 12 s for external LLM

// Per-user rate limit: generous in dev/test to allow repeatedly generating fresh messages
const welcomeRateMap = new Map(); // userId → [timestamp, ...]
const WELCOME_RATE_LIMIT = process.env.NODE_ENV === 'production' ? 20 : 200;
const WELCOME_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Session cache: cacheKey → { message, cachedAt }
const welcomeSessionCache = new Map();
const SESSION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min default if session caching requested

/**
 * Sanitize a user name so it is safe to embed as data in an LLM prompt.
 *  – strips control chars and newlines
 *  – collapses whitespace
 *  – truncates to 40 chars
 * The sanitized name is used ONLY as labelled data, never as instructions.
 */
export function sanitizeName(raw) {
  if (!raw) return 'Friend';
  let name = String(raw)
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')  // strip control chars
    .replace(/[<>\\/`{}[\]]/g, '')                   // strip tag and script injection chars
    .replace(/[\r\n]+/g, ' ')                        // strip newlines
    .trim()
    .slice(0, 40);
  name = name.replace(/\s+/g, ' ').trim();
  return name || 'Friend';
}

/** Returns true if within limit, false if rate-limited. */
function checkRateLimit(userId) {
  const now = Date.now();
  const key = String(userId);
  const timestamps = (welcomeRateMap.get(key) || []).filter(t => now - t < WELCOME_RATE_WINDOW_MS);
  if (timestamps.length >= WELCOME_RATE_LIMIT) {
    welcomeRateMap.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  welcomeRateMap.set(key, timestamps);
  return true;
}

const NEUTRAL_FALLBACKS = [
  n => `Take a soft breath, ${n}. Wherever today finds you, give yourself permission to slow down for just a few moments. You are worthy of quiet rest and steady care.`,
  n => `Welcome to your sanctuary, ${n}. In a world that constantly demands hurry, this space is yours to simply arrive as you are, without expectations or rush.`,
  n => `Hello ${n}. The path you are navigating holds many possibilities, and each mindful pause builds your inner quiet. Let us take this next step together.`,
  n => `${n}, you made it here today — and that matters. This is a space without judgment or hurry, just a gentle invitation to breathe and reflect.`,
  n => `Good to see you, ${n}. This moment belongs entirely to you. Let your shoulders soften and your thoughts settle. You are in the right place.`,
];

function getRandomFallback(name) {
  const safeName = sanitizeName(name);
  return NEUTRAL_FALLBACKS[Math.floor(Math.random() * NEUTRAL_FALLBACKS.length)](safeName);
}

/**
 * Make a single OpenRouter request with timeout.
 * Returns the trimmed content string or null on any error.
 */
/**
 * Make a single OpenRouter request with timeout.
 * Returns the trimmed content string or null on any error.
 */
async function callOpenRouter(model, messages, maxTokens = 600, temperature = 0.85) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY.trim()}`,
        'HTTP-Referer': 'https://mindcare.sanctuary',
        'X-Title': 'MindCare Sanctuary',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim();
    if (!content && data.choices?.[0]?.message?.reasoning) {
      // If model put output in reasoning block, extract last sentences
      const lines = data.choices[0].message.reasoning.split('\n').filter(Boolean);
      content = lines[lines.length - 1]?.replace(/^["']|["']$/g, '').trim();
    }
    return content && content.length > 10
      ? content.replace(/^["']|["']$/g, '').trim()
      : null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[aiService] Model ${model} error: ${err.message} (${err.name})`);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
export const aiService = {
  /**
   * Generate a dynamic welcome message.
   *
   * @param {string} userName  – name from DB/JWT only (NOT from query/body)
   * @param {string} userId    – for rate-limiting and session caching
   * @param {string} sessionId – JWT iat (issued-at) used as session discriminator
   */
  generateWelcomeMessage: async (userName = 'Friend', userId = null, sessionId = null) => {
    const safeName = sanitizeName(userName);

    // 1. Session cache check (re-renders do not re-call the API)
    if (userId && sessionId) {
      const cacheKey = `wm:${userId}:${sessionId}`;
      const cached = welcomeSessionCache.get(cacheKey);
      if (cached && Date.now() - cached.cachedAt < SESSION_CACHE_TTL_MS) {
        return { success: true, message: cached.message, source: 'cache' };
      }
    }

    // 2. No API key → deterministic fallback
    if (!OPENROUTER_API_KEY || !OPENROUTER_API_KEY.trim()) {
      return { success: true, message: getRandomFallback(safeName), source: 'fallback' };
    }

    // 3. Per-user rate limit
    if (userId && !checkRateLimit(String(userId))) {
      return { success: true, message: getRandomFallback(safeName), source: 'rate_limited' };
    }

    // 4. Build prompt – name is injected as labelled data, not free instructions
    const systemPrompt =
      `You are MindCare Sanctuary's welcoming companion writing a warm, soothing welcome note ` +
      `for a young adult member aged 20-25.\n\nRules:\n` +
      `1. You MUST address the member directly by their first name (${safeName}) in the first sentence.\n` +
      `2. Write exactly 2-3 soothing, spacious sentences.\n` +
      `3. Acknowledge the richness and intensity of young adulthood with uplifting hope and grounding presence.\n` +
      `4. NEVER use any of these words or their variants: suicide, self-harm, depression, anxiety, ` +
      `stress, panic, disorder, trauma, abuse, harassment, mental illness, hopeless, helpless, worthless.\n` +
      `5. Return ONLY the message text. No quotes, no commentary, no disclaimers.`;

    const userPrompt = `Member first name: ${safeName}\nPlease write a fresh, unique encouraging welcome note addressing ${safeName} warmly.`;

    const models = [
      'liquid/lfm-2.5-2.6b:free',
      'nvidia/nemotron-3.5-lightning:free',
      'google/gemma-4-26b-a4b-it:free',
      process.env.OPENROUTER_MODEL || 'openrouter/auto'
    ];

    let generated = null;
    for (const model of models) {
      const result = await callOpenRouter(model, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);
      if (!result) continue;

      const lower = result.toLowerCase();
      const hasBlocked = BLOCKED_WORDS.some(w => lower.includes(w.toLowerCase()));

      if (!hasBlocked) {
        generated = result;
        break;
      }

      // One stricter retry
      const strictSystem = systemPrompt +
        '\n\nIMPORTANT: Your previous response contained a flagged word. ' +
        'Rewrite without any of the blocked words listed above.';
      const retry = await callOpenRouter(model, [
        { role: 'system', content: strictSystem },
        { role: 'user', content: userPrompt }
      ]);

      if (retry) {
        const lowerRetry = retry.toLowerCase();
        const retryHasBlocked = BLOCKED_WORDS.some(w => lowerRetry.includes(w.toLowerCase()));
        if (!retryHasBlocked) {
          generated = retry;
          break;
        }
      }
    }

    // 5. Apply output filter; use fallback if filter removes all content
    let message = generated
      ? (filterOutput(generated, []) || getRandomFallback(safeName))
      : getRandomFallback(safeName);

    // Guarantee member name is always present
    if (safeName && safeName !== 'Friend' && !message.toLowerCase().includes(safeName.toLowerCase())) {
      message = `Welcome, ${safeName}. ${message}`;
    }

    // 6. Store in session cache
    if (userId && sessionId) {
      welcomeSessionCache.set(`wm:${userId}:${sessionId}`, { message, cachedAt: Date.now() });
    }

    return { success: true, message, source: generated ? 'llm' : 'fallback' };
  },

  // ──────────────────────────────────────────────────────────────────────────
  /**
   * Generate an AI companion reply.
   * Called by companionController after crisis detection passes.
   * Returns filtered reply string, or null if LLM is unavailable.
   *
   * @param {string}   userMessage   – current user message
   * @param {Array}    history       – last few safe turns [{role, content}], NO PII
   * @param {string[]} userWordsSeen – blocked words user introduced in this session
   */
  generateCompanionReply: async (userMessage, history = [], userWordsSeen = []) => {
    if (!OPENROUTER_API_KEY || !OPENROUTER_API_KEY.trim()) return null;

    const systemPrompt =
      `You are Aria, MindCare Sanctuary's warm, calm, non-judgmental AI wellness companion ` +
      `for young adults aged 20-25.\n\nTone: Warm, caring, grounded, encouraging — like a wise, gentle friend.\n\n` +
      `Rules you MUST follow:\n` +
      `1. NEVER use these words or their variants unless the user already used them first ` +
      `in this conversation: suicide, self-harm, depression, anxiety, stress, panic, disorder, ` +
      `trauma, abuse, harassment, mental illness, hopeless, helpless, worthless.\n` +
      `2. If the user mentioned any of those words, acknowledge their feeling with soft synonyms ` +
      `(e.g., "inner tension" not "stress"). Do NOT echo the exact word back.\n` +
      `3. Do NOT provide a diagnosis or medical advice.\n` +
      `4. When appropriate, gently suggest breathing exercises, games, journaling, or a professional.\n` +
      `5. Keep replies concise: 2-4 sentences. Be present, not preachy.\n` +
      `6. Never start your reply with "I" as the first word.`;

    const primaryModel  = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free';
    const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL || 'liquid/lfm-2.5-2.6b:free';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: userMessage }
    ];

    for (const model of [primaryModel, fallbackModel]) {
      const result = await callOpenRouter(model, messages, 250, 0.8);
      if (!result) continue;

      // Check if raw LLM output contains any unintroduced blocked words
      const lowerRaw = result.toLowerCase();
      const hasBlocked = BLOCKED_WORDS.some(w => {
        const introduced = userWordsSeen.some(uw => w.includes(uw) || uw.includes(w));
        return !introduced && lowerRaw.includes(w.toLowerCase());
      });

      if (!hasBlocked) {
        return filterOutput(result, userWordsSeen);
      }

      // One stricter retry
      const strictSystem = systemPrompt +
        '\n\nIMPORTANT: Your previous response contained a flagged word. ' +
        'Rewrite without any of the blocked words listed above.';
      const retry = await callOpenRouter(model, [
        { role: 'system', content: strictSystem },
        ...history.slice(-4),
        { role: 'user', content: userMessage }
      ], 250, 0.7);

      if (retry) {
        return filterOutput(retry, userWordsSeen);
      }
    }

    return null; // caller uses safe rule-based fallback
  }
};
