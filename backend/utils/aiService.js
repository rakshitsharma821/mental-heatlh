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
    if (content) {
      content = content
        .replace(/^(\*Draft\s*\d+:?\*?|Draft\s*\d+:?)\s*/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();
    }
    return content && content.length > 10 ? content : null;
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
      process.env.OPENROUTER_MODEL || 'openrouter/auto',
      'liquid/lfm-2.5-2.6b:free',
      'nvidia/nemotron-3.5-lightning:free'
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
      `You are Aria, an emotionally intelligent, compassionate, and uplifting AI companion for young adults (aged 20-25) at MindCare Sanctuary.\n\n` +
      `PERSONALITY & CONVERSATIONAL STYLE:\n` +
      `- Be a true conversational AI — speak naturally, warmly, intelligently, and empathetically, just like chatting with an understanding, supportive friend.\n` +
      `- CRITICAL: NEVER BE DEMOTIVATIONAL. Never tell the user that their mind is broken, flawed, defective, or demotivated. Never overtrigger or pathologize their everyday challenges, feelings, or stress.\n` +
      `- UPLIFTING & GROUNDED: Validate their human feelings with warmth and kindness, then help them find calm perspective, small manageable steps, and inner strength.\n` +
      `- LANGUAGE: If the user speaks in Hindi, Hinglish, or English, respond naturally in the same comfortable language/tone with deep cultural warmth.\n` +
      `- NO MEDICAL DIAGNOSES: Do not diagnose the user with psychiatric disorders or give clinical prescriptions. Keep language human and relatable.\n` +
      `- CONVERSATION FLOW: Keep responses thoughtful, engaging, and digestible (2-4 sentences). Feel free to ask a gentle, friendly question to continue the conversation.`;

    const models = [
      process.env.OPENROUTER_MODEL || 'openrouter/auto',
      'liquid/lfm-2.5-2.6b:free',
      'nvidia/nemotron-3.5-lightning:free'
    ];

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: userMessage }
    ];

    for (const model of models) {
      const result = await callOpenRouter(model, messages, 500, 0.8);
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
      ], 500, 0.7);

      if (retry) {
        return filterOutput(retry, userWordsSeen);
      }

      // Safely rewrite with soft synonyms instead of discarding the AI response
      return filterOutput(result, userWordsSeen);
    }

    return null; // caller uses safe rule-based fallback
  },

  // ──────────────────────────────────────────────────────────────────────────
  /**
   * Analyze client assessment answers and recommend targeted therapy modalities & clinician match.
   * Leverages OpenRouter API to evaluate nuanced symptom categories for both the user
   * and the therapist's workstation report.
   *
   * @param {Object} params
   * @param {number} params.totalScore - Total score (0-24)
   * @param {string} params.band - Low, Moderate, High
   * @param {Object|Array} params.answers - Questionnaire answers
   * @param {string} params.userName - Optional client name / alias
   * @param {number} params.userAge - Optional client age
   * @returns {Promise<Object>} Structured clinical intake analysis & therapy recommendations
   */
  analyzeAssessmentAndSuggestTherapy: async ({ totalScore = 10, band = 'moderate', answers = {}, userName = 'Client', userAge = 22 } = {}) => {
    const score = Math.max(0, Math.min(24, Number(totalScore) || 0));
    const safeName = sanitizeName(userName);

    // Question label mapping for clinically grounded analysis
    const categoryLabels = {
      q1: 'Physical & Mental Energy / Fatigue',
      q2: 'Nervous Tension & Catastrophizing Loops',
      q3: 'Somatic Ease & Bodily Relaxation',
      q4: 'Sleep Restoration & Circadian Disruption',
      q5: 'Enthusiasm & Emotional Apathy',
      q6: 'Mental Focus & Cognitive Fog',
      q7: 'Emotional Threshold & Reactive Overwhelm',
      q8: 'Self-Compassion vs Harsh Self-Criticism'
    };

    let answerBreakdown = '';
    if (Array.isArray(answers)) {
      answerBreakdown = answers.map((a, i) => `Question ${i + 1} (${categoryLabels[`q${i + 1}`] || 'Category'}): score ${a?.score ?? a} out of 3`).join('\n');
    } else if (typeof answers === 'object' && answers !== null) {
      answerBreakdown = Object.entries(answers).map(([k, v]) => `${categoryLabels[k] || k}: score ${typeof v === 'object' ? v.score : v} out of 3`).join('\n');
    }

    // Dynamic Clinical Rule-Based Generator (used as fallback or when API offline)
    const generateClinicalFallback = () => {
      let recommendedTherapy = 'Cognitive Behavioral Therapy (CBT) & Somatic Regulation';
      let recommendedSpecialist = 'Licensed Clinical Psychologist (CBT & Somatic Specialist)';
      let focusAreas = ['Cognitive restructuring of worry loops', 'Somatic regulation & vagal calming', 'Restorative sleep stabilization'];
      let sessionFrequency = 'Weekly structured sessions';
      let clinicalSummary = `The client exhibits an accumulated stress load (Score: ${score}/24, ${band.toUpperCase()} band) with pronounced autonomic arousal and mental fatigue.`;
      let rationale = 'Cognitive Behavioral Therapy combined with nervous system down-regulation directly addresses the interplay between cognitive racing and bodily exhaustion.';
      let therapistIntakeNotes = `Client presents with moderate functional burden. Initial sessions should prioritize establishing safety, grounding somatic tension, and mapping persistent cognitive loops before moving into deeper cognitive reframing.`;

      if (score <= 7) {
        recommendedTherapy = 'Solution-Focused Brief Practice (SFBT) & Mindfulness-Based Stress Reduction (MBSR)';
        recommendedSpecialist = 'Wellness Counselor & Mindfulness Practitioner';
        focusAreas = ['Proactive routine balance', 'Micro-moments of mindful grounding', 'Burnout prevention & work-life boundaries'];
        sessionFrequency = 'Bi-weekly check-ins or as-needed guidance';
        clinicalSummary = `The client demonstrates solid baseline psychological resilience (Score: ${score}/24, STEADY RHYTHM band) with manageable situational stress.`;
        rationale = 'Solution-Focused practice reinforces existing coping mechanisms and self-efficacy without unnecessary clinical over-pathologizing.';
        therapistIntakeNotes = `Client has strong emotional resources. Focus on goal-setting, routine architecture, and positive habit reinforcement.`;
      } else if (score >= 16) {
        recommendedTherapy = 'Trauma-Informed Psychotherapy & Comprehensive Clinical Diagnostics';
        recommendedSpecialist = 'Senior Clinical Psychologist / Psychiatrist';
        focusAreas = ['Acute nervous system down-regulation', 'Comprehensive psychiatric evaluation', 'Emotional safety stabilization', 'Restorative sleep & burnout recovery'];
        sessionFrequency = 'Priority immediate consultation & structured clinical pathway';
        clinicalSummary = `The client reports acute emotional burden and exhaustion (Score: ${score}/24, CARE & COMFORT band) indicating significant nervous system strain.`;
        rationale = 'Comprehensive clinical care provides dedicated safety stabilization, diagnostic depth, and tailored psychotherapeutic interventions.';
        therapistIntakeNotes = `URGENT INTAKE: Client is navigating heavy emotional drain. Pacing must be slow and non-demanding. Prioritize immediate stabilization, emotional containment, and sleep support.`;
      }

      return {
        clinicalSummary,
        recommendedTherapy,
        recommendedSpecialist,
        focusAreas,
        rationale,
        therapistIntakeNotes,
        sessionFrequency,
        source: 'clinical_heuristics'
      };
    };

    // If OpenRouter API key is missing, return expert clinical fallback
    if (!OPENROUTER_API_KEY || !OPENROUTER_API_KEY.trim()) {
      return generateClinicalFallback();
    }

    const systemPrompt =
      `You are an expert Clinical Intake Psychologist and Diagnostic Assessment Specialist at MindCare Sanctuary.\n` +
      `Your task is to review a young adult client's (aged 20-25) standardized mental health questionnaire results ` +
      `and formulate a tailored, evidence-based therapy modality recommendation and a detailed clinical intake briefing ` +
      `for the consulting therapist's workstation.\n\n` +
      `CRITICAL GUIDELINES:\n` +
      `- Never be demotivational or overly pessimistic. Frame challenges with clinical precision, hope, and actionable recovery pathways.\n` +
      `- Base recommendations strictly on the symptom profile: CBT for overthinking/catastrophizing, ACT for experiential avoidance/harsh self-criticism, MBSR/Somatic for bodily tension and sleep dysregulation, SFBT for mild situational balance.\n` +
      `- Output MUST be valid, parsable JSON only with NO markdown code fences, NO extraneous commentary.\n\n` +
      `REQUIRED JSON SCHEMA:\n` +
      `{\n` +
      `  "clinicalSummary": "2-3 sentences summarizing the client's current emotional state and autonomic tone.",\n` +
      `  "recommendedTherapy": "Name of specific therapy modality (e.g. Cognitive Behavioral Therapy (CBT) & Acceptance and Commitment Therapy (ACT))",\n` +
      `  "recommendedSpecialist": "Type of practitioner suited (e.g. Licensed Clinical Psychologist (CBT/ACT Specialist))",\n` +
      `  "focusAreas": ["3-4 concise, specific clinical intervention targets"],\n` +
      `  "rationale": "Why this specific modality is the optimal match for the client's questionnaire pattern.",\n` +
      `  "therapistIntakeNotes": "A concise clinical briefing prepared specifically for the therapist when opening this client's dossier (presentation highlights, session 1 focus, pacing considerations).",\n` +
      `  "sessionFrequency": "e.g. Weekly structured therapy sessions or Bi-weekly check-ins"\n` +
      `}`;

    const userPrompt =
      `Client: ${safeName} (Age: ${userAge || 22})\n` +
      `Total Score: ${score} / 24\n` +
      `Score Classification Band: ${band.toUpperCase()}\n\n` +
      `Item Breakdown:\n${answerBreakdown || 'Standard standardized 8-item screener completed.'}\n\n` +
      `Please generate the clinical analysis and therapeutic recommendation JSON now.`;

    const models = [
      process.env.OPENROUTER_MODEL || 'openrouter/auto',
      'liquid/lfm-2.5-2.6b:free',
      'nvidia/nemotron-3.5-lightning:free'
    ];

    for (const model of models) {
      try {
        const rawResult = await callOpenRouter(model, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ], 750, 0.4);

        if (!rawResult) continue;

        // Clean potential markdown code blocks (```json ... ```)
        let cleaned = rawResult.trim()
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim();

        const parsed = JSON.parse(cleaned);

        if (parsed.recommendedTherapy && parsed.recommendedSpecialist && Array.isArray(parsed.focusAreas)) {
          return {
            clinicalSummary: parsed.clinicalSummary || '',
            recommendedTherapy: parsed.recommendedTherapy,
            recommendedSpecialist: parsed.recommendedSpecialist,
            focusAreas: parsed.focusAreas,
            rationale: parsed.rationale || '',
            therapistIntakeNotes: parsed.therapistIntakeNotes || '',
            sessionFrequency: parsed.sessionFrequency || 'Weekly sessions',
            source: 'openrouter_ai',
            model
          };
        }
      } catch (e) {
        console.warn(`[aiService] Failed to parse JSON from model ${model}:`, e.message);
      }
    }

    // Fallback if all OpenRouter calls fail
    return generateClinicalFallback();
  }
};
