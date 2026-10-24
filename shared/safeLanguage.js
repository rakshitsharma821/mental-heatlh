// ============================================
// MindCare Sanctuary — Single Shared Source of Truth for Safe Language
// Consolidates all blocked vocabulary, safe synonyms, crisis patterns, and output filtering
// Used by both Backend and Frontend
// ============================================

export * from './helplines.js';

// Base blocked vocabulary categories with inflections & variants
export const BLOCKED_WORD_GROUPS = {
  selfHarm: [
    'self-harm', 'self harm', 'selfharm', 'self-injury', 'cutting myself',
    'hurting myself', 'hurt myself', 'harm myself', 'harming myself',
    'bleed out', 'overdose'
  ],
  suicide: [
    'suicide', 'suicidal', 'suicidality', 'kill myself', 'killing myself', 'end my life',
    'ending my life', 'take my own life', 'taking my own life', 'want to die',
    'better off dead', 'no reason to live', 'wish i were dead', 'wish i was dead'
  ],
  depression: [
    'depression', 'depressed', 'depressing', 'depressive'
  ],
  stress: [
    'stress', 'stressed', 'stressing', 'stressful', 'stressor', 'stressors', 'overstressed'
  ],
  anxiety: [
    'anxiety', 'anxious', 'anxiously', 'anxieties'
  ],
  harassment: [
    'harassment', 'harassed', 'harassing', 'harasser', 'harassers'
  ],
  panic: [
    'panic', 'panicking', 'panicked', 'panicky', 'panic attack', 'panic attacks'
  ],
  trauma: [
    'trauma', 'traumatic', 'traumatized', 'traumatising', 'traumatizing', 'ptsd'
  ],
  abuse: [
    'abuse', 'abusive', 'abused', 'abuser', 'abusers', 'abusing'
  ],
  distressHinglish: [
    'pareshan', 'bahut pareshan', 'udaas', 'tang aa gaya', 'tang aa gayi',
    'thak gaya', 'thak gayi', 'himmat nahi', 'jeena nahi chahta', 'jeena nahi chahti',
    'marna chahta', 'marna chahti', 'jaan dena chahta', 'jaan dena chahti',
    'khud ko hurt', 'khud ko nuksan'
  ],
  clinicalLabels: [
    'disorder', 'mental illness', 'psychiatric breakdown', 'nervous breakdown',
    'worthless', 'hopeless'
  ]
};

// Flattened list of all blocked word phrases and inflections (sorted by length descending for regex matching)
export const BLOCKED_WORDS = Array.from(new Set(Object.values(BLOCKED_WORD_GROUPS).flat())).sort((a, b) => b.length - a.length);

// Safe synonym replacement dictionary
export const SAFE_SYNONYMS = {
  selfHarm: 'heavy moments',
  suicide: 'profound heaviness',
  depression: 'emotional heaviness',
  stress: 'tension',
  anxiety: 'unease',
  harassment: 'difficult circumstances',
  panic: 'racing thoughts',
  trauma: 'past deep hurt',
  abuse: 'unhealthy treatment',
  general: 'what you are experiencing'
};

// Safe fallback replies when LLM output violates policy or needs grounding
export const SAFE_FALLBACK_REPLIES = {
  crisis: "I hear how deeply heavy things feel right now, and you do not have to carry this alone. Would you like me to call a helpline for you?",
  sensitive: "Thank you for trusting me with what you are experiencing right now. Your well-being matters deeply. Would you like me to call a helpline for you?",
  general: "I'm right here with you in this quiet space. Take a gentle breath. What feels most supportive for you right now?"
};

// Deterministic Crisis Patterns (English + Hinglish)
export const CRISIS_PATTERNS = [
  // English Crisis Patterns
  /\b(self[-\s]?harm|selfharm|hurting\s+myself|cutting\s+myself|bleed\s+out|overdose)\b/i,
  /\b(suicid(?:e|al)|kill\s+myself|end\s+my\s+life|take\s+my\s+own\s+life|want\s+to\s+die|wish\s+i\s+(?:were|was)\s+dead|better\s+off\s+dead)\b/i,
  /\b(can't\s+go\s+on|no\s+reason\s+to\s+live|don't\s+want\s+to\s+live|give\s+up\s+on\s+life)\b/i,

  // Hinglish Crisis Patterns
  /\b(marna\s+chahta|marna\s+chahti|marne\s+ka\s+man|mar\s+jaunga|mar\s+jaungi|mar\s+jana\s+chahta)\b/i,
  /\b(jaan\s+de\s+dunga|jaan\s+de\s+dungi|jaan\s+lena|khud\s+ko\s+chot|khud\s+ko\s+marna)\b/i,
  /\b(zindagi\s+khatam|jeene\s+ka\s+koi\s+fayda\s+nahi|khatam\s+karna\s+chahta|zinda\s+nahi\s+rehna|sab\s+khatam\s+karna)\b/i,
  /\b(suicide\s+karna|suicide\s+karne|faasi|zeher|ab\s+nahi\s+jiya\s+jata|jaan\s+chhod\s+du)\b/i,

  // Devanagari Hindi Crisis Patterns
  /(मरना\s*चाहता|मरना\s*चाहती|मरने\s*का\s*मन|जान\s*देना|जान\s*लेना|खुद\s*को\s*चोट|खुद\s*को\s*खत्म|आत्महत्या)/u
];

/**
 * Checks whether text matches deterministic crisis triggers.
 */
export function isCrisisIntent(message) {
  if (!message || typeof message !== 'string') return false;
  return CRISIS_PATTERNS.some(pattern => pattern.test(message));
}
export const hasCrisisTrigger = isCrisisIntent;

/**
 * Detects which blocked words or categories the user introduced in their text.
 * Returns an array of matched blocked words.
 */
export function detectUserIntroducedWords(message) {
  if (!message || typeof message !== 'string') return [];
  const lower = message.toLowerCase();
  const matched = [];

  for (const word of BLOCKED_WORDS) {
    const escaped = word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lower)) {
      matched.push(word);
    }
  }

  return matched;
}
export const extractUserWords = detectUserIntroducedWords;

/**
 * Checks if a text contains any blocked word.
 * Returns the first matched word or null.
 */
export function findBlockedWord(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();

  for (const word of BLOCKED_WORDS) {
    const escaped = word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lower)) {
      return word;
    }
  }
  return null;
}

/**
 * Returns all blocked words found in text.
 */
export function findBlockedWords(text) {
  return detectUserIntroducedWords(text);
}

/**
 * Map a specific blocked word to its safe soft synonym.
 */
export function getSafeSynonym(word) {
  const lower = (word || '').toLowerCase();
  if (lower.includes('harm') || lower.includes('cutting') || lower.includes('bleed') || lower.includes('overdose') || lower.includes('hurt')) {
    return SAFE_SYNONYMS.selfHarm;
  }
  if (lower.includes('suicid') || lower.includes('kill') || lower.includes('die') || lower.includes('dead') || lower.includes('end my life')) {
    return SAFE_SYNONYMS.suicide;
  }
  if (lower.includes('depress') || lower.includes('udaas')) {
    return SAFE_SYNONYMS.depression;
  }
  if (lower.includes('stress') || lower.includes('pareshan') || lower.includes('tang')) {
    return SAFE_SYNONYMS.stress;
  }
  if (lower.includes('anxi')) {
    return SAFE_SYNONYMS.anxiety;
  }
  if (lower.includes('harass')) {
    return SAFE_SYNONYMS.harassment;
  }
  if (lower.includes('panic')) {
    return SAFE_SYNONYMS.panic;
  }
  if (lower.includes('trauma') || lower.includes('ptsd')) {
    return SAFE_SYNONYMS.trauma;
  }
  if (lower.includes('abuse') || lower.includes('abusi')) {
    return SAFE_SYNONYMS.abuse;
  }
  return 'emotional heaviness';
}

/**
 * Strict Output Filter:
 * - Scans every bot reply (LLM or rule-based) against blocked words.
 * - If user did NOT introduce the word: rewrites with soft synonym.
 * - If user DID introduce the word: bot still avoids echoing it, rewrites with "what you are experiencing" or soft synonym.
 * @param {string} replyText - The message to filter
 * @param {string|string[]} userMessageOrWords - User's message or array of words user introduced
 */
export function filterBotOutput(replyText, userMessageOrWords = '') {
  if (!replyText || typeof replyText !== 'string') return replyText;
  let sanitized = String(replyText);

  // Normalize user introduced words into a set of lowercase strings
  let userIntroducedSet = new Set();
  if (Array.isArray(userMessageOrWords)) {
    userMessageOrWords.forEach(w => userIntroducedSet.add(String(w).toLowerCase()));
  } else if (typeof userMessageOrWords === 'string') {
    const userWords = detectUserIntroducedWords(userMessageOrWords);
    userWords.forEach(w => userIntroducedSet.add(w.toLowerCase()));
  }

  for (const word of BLOCKED_WORDS) {
    const escaped = word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

    if (!regex.test(sanitized)) continue;

    const userIntroducedThis = userIntroducedSet.has(word.toLowerCase());

    sanitized = sanitized.replace(regex, (match) => {
      // If user introduced this term in the conversation, do not echo it back
      if (userIntroducedThis) {
        return 'what you are experiencing';
      }
      // If user did not introduce it, replace with soft synonym
      return getSafeSynonym(match);
    });
  }

  return sanitized;
}

export const filterOutput = filterBotOutput;
